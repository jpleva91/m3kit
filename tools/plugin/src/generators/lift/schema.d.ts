export interface LiftGeneratorSchema {
  /** m3kit libs to lift; the dependency closure is added automatically. */
  libs: string[];
  /** Consumer alias prefix (`@<scope>/<lib>`, `scope:<scope>-<lib>`). Default `ui`. */
  scope?: string;
  /** Git ref of the m3kit repo to lift from. Default `main`. */
  ref?: string;
  /** GitHub `<owner>/<repo>` source. Default `jpleva91/m3kit`. */
  repo?: string;
  /** Internal/testing: pre-extracted m3kit workspace dir (skips download). */
  sourceDir?: string;
}
