// Extracts the names of all {placeholders} appearing in a template string type.
// Example: 'Hello, my name is {name}.' -> 'name'
type PlaceholderNames<S extends string> =
    S extends `${string}{${infer Name}}${infer Rest}`
        ? Name | PlaceholderNames<Rest>
        : never;

// The parameter object a given template requires.
// Every {placeholder} found in the template becomes a required key,
// so passing an unknown name or forgetting one is a compile-time error.
export type MessageParams<S extends string> = {
    [K in PlaceholderNames<S>]: string | number | undefined;
};

export function maketext<S extends string>(template: S, context: MessageParams<S>): string {
    // find placeholders and interpolate them;
    // if a parameter is missing (null/undefined), the token is left as-is
    return String(template).replace((/\\?\{([^{}]+)\}/g), function(match, name: string) {
        const value = context[name as keyof MessageParams<S>];
        return (value != null) ? String(value) : match;
    });
}
