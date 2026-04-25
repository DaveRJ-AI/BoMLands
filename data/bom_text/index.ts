import { Verse } from "../../types";

import { verses1Nephi } from "./1-nephi-verses";
import { verses2Nephi } from "./2-nephi-verses";
import { versesJacob } from "./jacob-verses";
import { versesEnos } from "./enos-verses";
import { versesJarom } from "./jarom-verses";
import { versesOmni } from "./omni-verses";
import { versesWordsOfMormon } from "./words-of-mormon-verses";
import { versesMosiah } from "./mosiah-verses";
import { versesAlma } from "./alma-verses";
import { versesHelaman } from "./helaman-verses";
import { verses3Nephi } from "./3-nephi-verses";
import { verses4Nephi } from "./4-nephi-verses";
import { versesMormon } from "./mormon-verses";
import { versesEther } from "./ether-verses";
import { versesMoroni } from "./moroni-verses";

export const bomVerses: Verse[] = [
  ...verses1Nephi,
  ...verses2Nephi,
  ...versesJacob,
  ...versesEnos,
  ...versesJarom,
  ...versesOmni,
  ...versesWordsOfMormon,
  ...versesMosiah,
  ...versesAlma,
  ...versesHelaman,
  ...verses3Nephi,
  ...verses4Nephi,
  ...versesMormon,
  ...versesEther,
  ...versesMoroni,
];

export default bomVerses;