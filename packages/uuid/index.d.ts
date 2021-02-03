declare module '@easen-tools/uuid' {
  interface UuidGenerator {
    (): string;
    bin: () => number[];
  }

  export const test: (uuid: string) => boolean;
  export const generate: UuidGenerator;
  export const generateUnsafe: UuidGenerator;
}
