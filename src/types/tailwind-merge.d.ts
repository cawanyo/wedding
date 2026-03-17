declare module 'tailwind-merge' {
  export type ClassNameValue = string | null | undefined | false | 0 | ClassNameArray
  interface ClassNameArray extends Array<ClassNameValue> {}
  export function twMerge(...classLists: ClassNameValue[]): string
  export function extendTailwindMerge(config: any): typeof twMerge
  export function createTailwindMerge(createConfig: any): typeof twMerge
}
