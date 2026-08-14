/** Return placeholder names once, preserving their first appearance order. */
export declare function extractSnippetVariables(command: string): string[];
/** Replace known placeholders while leaving unknown ones untouched. */
export declare function interpolateSnippet(command: string, values: Record<string, string>): string;
