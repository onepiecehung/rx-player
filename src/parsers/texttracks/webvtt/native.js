import arrayIncludes from "../../../../utils/array-includes.js";
import { makeCue } from "../../../../compat/index.js";

// Simple VTT to VTTCue parser:
// Just parse cues and associated settings.
// Does not take into consideration STYLE and REGION blocks.

/**
 * Parse whole WEBVTT file into an array of cues, to be inserted in a video's
 * TrackElement.
 * @param {string}
 * @returns {Array.<VTTCue|TextTrackCue>}
 */
export default function parseVTTStringToVTTCues(vttStr) {
  // TODO Take every block but STYLE REGION NOTE or the first line
  // Give them to parseCue to construct array

  // WEBVTT authorize CRLF, LF or CR as line terminators
  const lines = vttStr.split(/(\r\n)|\n|\r/);

  if (!(/^WEBVTT($ | |\t)/.test(lines[0]))) {
    throw new Error("Can't parse WebVTT: Invalid file.");
  }

  const cueBlocks = [];

  for (let i = 1; i < lines.length; i++) {
    if (isStartOfCueBlock(lines[i])) {
      const startingI = i;
      i++;

      // continue incrementing i until either:
      //   - empty line
      //   - end
      for (; lines[i] && i < lines.length; i++) {}
      cueBlocks.push(lines.slice(startingI, i));
    }
  }

  const cues = [];
  for (let i = 0; i < cueBlocks.length; i++) {
    const cue = parseCue(cueBlocks[i]);
    if (cue) {
      cues.push(cue);
    }
  }
  return cues;
}

/**
 * Returns true if the line given looks like the beginning of a cue.
 * You should provide to this function only lines following "empty" lines.
 * @param {string} line
 * @returns {Boolean}
 */
function isStartOfCueBlock(line) {
  // checked cases:
  //   - empty lines
  //   - start of a comment
  //   - start of a region
  //   - start of a style
  // Anything else should be a cue. TODO re-check with the spec
  if (!line || /^(NOTE)|(REGION)|(STYLE)($| |\t)/.test(line)) {
    return false;
  }
  return true;
}

/**
 * Parse cue block into a cue.
 * @param {Array.<string>} cueLines
 * @returns {TextTrackCue|VTTCue}
 */
function parseCue(cueLines) {
  const timingRegexp = /-->/;
  let timeString;
  let payloadLines;

  if (!timingRegexp.test(cueLines[0])) {
    if (!timingRegexp.test(cueLines[1])) {
      // not a cue
      return null;
    }
    timeString = cueLines[1];
    payloadLines = cueLines.slice(2, cueLines.length);
  } else {
    timeString = cueLines[0];
    payloadLines = cueLines.slice(1, cueLines.length);
  }

  const timeAndSettings = parseTimeAndSettings(timeString);
  if (!timeAndSettings) {
    return null;
  }

  const { start, end, settings } = timeAndSettings;
  const payload = payloadLines.join("\n");
  const cue = makeCue(start, end, payload);
  setSettingsOnCue(settings, cue);

  return cue;
}

/**
 * Parse a single WEBVTT timestamp into seconds
 * @param {string} timestampString
 * @returns {Number}
 */
function parseTimestamp(timestampString) {
  const splittedTS = timestampString.split(":");
  if (splittedTS.length === 3) {
    const hours = parseInt(splittedTS[0], 10);
    const minutes = parseInt(splittedTS[1], 10);
    const seconds = parseFloat(splittedTS[2], 10);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return;
    }
    return hours * 60 * 60 + minutes * 60 + seconds;
  } else if (splittedTS.length === 2) {
    const minutes = parseInt(splittedTS[1], 10);
    const seconds = parseFloat(splittedTS[2], 10);
    if (isNaN(minutes) || isNaN(seconds)) {
      return;
    }
    return minutes * 60 + seconds;
  }
}

/**
 * Parse the settings part of a cue, into key-value object.
 * @param {string} settingsString
 * @returns {Object}
 */
function parseSettings(settingsString) {
  const splittedSettings = settingsString.split(/ |\t/);
  return splittedSettings.reduce((acc, setting) => {
    const splittedSetting = setting.split(":");
    if (splittedSetting.length === 2) {
      acc[splittedSetting[0]] = splittedSetting[1];
    }
    return acc;
  }, {});
}

/**
 * Parse the line containing the timestamp and settings in a cue.
 * The returned object has the following properties:
 *   - start {Number}: start of the cue, in seconds
 *   - end {Number}: end of the cue, in seconds
 *   - settings {Object}: settings for the cue as a key-value object.
 * @param {string} timeString
 * @returns {Object|null}
 */
function parseTimeAndSettings(timeString) {
  /*
   * RegExp for the timestamps + settings line.
   *
   * Capture groups:
   *   1 -> start timestamp
   *   2 -> end timestamp
   *   3 - settings
   * @type {RegExp}
   */
  const lineRegex = /^([\d:.]+)[ |\t]+-->[ |\t]+([\d:.]+)[ |\t]*(.*)$/;

  const matches = timeString.match(lineRegex);
  if (!matches){
    return null;
  }

  const start = parseTimestamp(matches[1]);
  const end = parseTimestamp(matches[2]);
  if (start == null || end == null) {
    return null;
  }

  const settings = parseSettings(matches[3]);

  return {
    start,
    end,
    settings,
  };
}

/**
 * Add the corresponding settings on the given cue.
 * /!\ Mutates the cue given.
 * @param {Object} settings - settings for the cue, as a key-value object.
 * @param {VTTCue|TextTrackCue} cue
 */
function setSettingsOnCue(settings, cue) {
  if (
    settings.vertical &&
    (settings.vertical === "rl" || settings.vertical === "lr")
  ) {
    cue.vertical = settings.vertical;
  }

  if (settings.line) {

    /**
     * Capture groups:
     *   1 -> percentage position
     *   2 -> optional decimals from percentage position
     *   3 -> optional follow-up of the string indicating alignment value
     *   4 -> alignment value
     * @type {RegExp}
     */
    const percentagePosition = /^(\d+(\.\d+)?)%(,([a-z]+))?/;
    const percentageMatches = settings.line.match(percentagePosition);
    if (percentageMatches) {
      cue.line = percentageMatches[1];
      cue.snapToLines = false;
      if (arrayIncludes(["start", "center", "end"], percentageMatches[4])) {
        cue.lineAlign = percentageMatches[4];
      }
    } else {
      /**
       * Capture groups:
       *   1 -> line number
       *   2 -> optional follow-up of the string indicating alignment value
       *   3 -> alignment value
       * @type {RegExp}
       */
      const linePosition = /^(-?\d+)(,([a-z]+))?/;
      const lineMatches = settings.line.match(linePosition);

      if (lineMatches) {
        cue.line = lineMatches[1];
        cue.snapToLines = true;
        if (arrayIncludes(["start", "center", "end"], percentageMatches[3])) {
          cue.lineAlign = percentageMatches[3];
        }
      }
    }
  }

  if (settings.position) {
    const positionRegex = /^([\d\.]+)%(?:,(line-left|line-right|center))?$/;
    const positionArr = positionRegex.exec(settings.position);
    const position = parseInt(positionArr[1], 10);
    if (!isNaN(position)) {
      cue.position = position;

      if (positionArr[2]) {
        cue.positionAlign = positionArr[2];
      }
    }
  }

  if (settings.size) {
    cue.size = settings.size;
  }

  if (
    settings.align &&
    arrayIncludes(["start", "center", "end", "left"], settings.align)) {
    cue.align  = settings.align;
  }
}
