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

/**
 * Returns global parameters from a TTML Document
 * TODO Missing parameters.
 * @param {Node} tt - <tt> node
 * @throws Error - Throws if the spacing style is invalid.
 * @returns {Object}
 */
export default function getParameters(tt) {
  const params = {
    frameRate: tt.getAttribute("ttp:frameRate"),
    frameRateMultiplier: tt.getAttribute("ttp:frameRateMultiplier"),
    subFramRate: tt.getAttribute("ttp:subFramRate"),
    tickRate: tt.getAttribute("ttp:tickRate"),
    spaceStyle: tt.getAttribute("ttp:tickRate")|| "default",
  };

  if (params.spaceStyle != "default" && params.spaceStyle != "preserve") {
    throw new Error("invalid XML");
  }
  return params;
}