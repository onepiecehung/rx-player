/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const objectAssign = require("object-assign");
const arrayFind = require("array-find");

import Representation, { IRepresentationArguments } from "./representation";
import generateNewId from "../utils/id";

export interface IAdaptationArguments {
  // -- required
  manual : boolean;
  representations : IRepresentationArguments[];
  type : string;

  // -- optional
  audioDescription? : boolean;
  closedCaption? : boolean;
  contentProtection? : any; // XXX TODO
  id? : number|string;
  language? : string;
  normalizedLanguage? : string;
  smoothProtection? : any; // XXX TODO
}

/**
 * Normalized Adaptation structure.
 * @class Adaptation
 */
class Adaptation {
  // required
  public id : string|number;
  public representations : Representation[];
  public type : string;

  // optional
  public _smoothProtection? : any; // XXX TODO
  public contentProtection? : any; //  XXX TODO
  public isAudioDescription? : boolean;
  public isClosedCaption? : boolean;
  public language? : string;
  public manual? : boolean;
  public normalizedLanguage? : string;

  /**
   * @constructor
   */
  constructor(args : IAdaptationArguments) {
    const nId = generateNewId();
    this.id = args.id == null ? nId : "" + args.id;
    this.type = args.type || "";
    this.representations = Array.isArray(args.representations) ?
      args.representations
        .map(r => new Representation(objectAssign({ rootId: this.id }, r)))
        .sort((a, b) => a.bitrate - b.bitrate) : [];

    if (args.language != null) {
      this.language = args.language;
    }

    if (args.normalizedLanguage != null) {
      this.normalizedLanguage = args.normalizedLanguage;
    }

    if (args.closedCaption != null) {
      this.isClosedCaption = args.closedCaption;
    }
    if (args.audioDescription != null) {
      this.isAudioDescription = args.audioDescription;
    }

    // TODO rename both protectionData?
    if (args.contentProtection != null) {
      this.contentProtection = args.contentProtection;
    }
    if (args.smoothProtection != null) {
      this._smoothProtection = args.smoothProtection;
    }

    // for manual adaptations (not in the manifest)
    this.manual = args.manual;

    // ---------
    // this._rootURL = args.rootURL;
    // this._baseURL = args.baseURL;
  }

  /**
   * @returns {Array.<Number>}
   */
  getAvailableBitrates() : number[] {
    return this.representations
      .map(r => r.bitrate);
  }

  /**
   * @param {Number|string} wantedId
   * @returns {Representation}
   */
  getRepresentation(wantedId : number|string) : Representation|undefined {
    return arrayFind(this.representations,
      ({ id } : Representation) => wantedId === id);
  }

  /**
   * @param {Number} bitrate
   * @returns {Representations[]|null}
   */
  getRepresentationsForBitrate(bitrate : number) : Representation[]|null {
    return this.representations.filter(r => r.bitrate === bitrate) || null;
  }
}

export default Adaptation;
