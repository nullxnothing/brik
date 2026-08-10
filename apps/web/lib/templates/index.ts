import { NFT_MINT } from "./nft-mint";
import { TIP_JAR } from "./tip-jar";
import { TOKEN_GATE } from "./token-gate";
import { USDC_CHECKOUT } from "./usdc-checkout";
import type { Template } from "./types";

export type { FollowUp, Template } from "./types";
export { isAnchorProject } from "./types";

export const TEMPLATES: Template[] = [
  TIP_JAR,
  NFT_MINT,
  TOKEN_GATE,
  USDC_CHECKOUT,
];

export const DEFAULT_TEMPLATE = TIP_JAR;

export function findTemplate(slug: string | undefined): Template | undefined {
  return TEMPLATES.find((template) => template.slug === slug);
}
