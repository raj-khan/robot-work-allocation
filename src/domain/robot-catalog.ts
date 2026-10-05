import { z } from 'zod';

const robotTypeSchema = z.object({
  name: z.string().trim().min(1),
  hoursPerDay: z.number().int().positive(),
  costPerDay: z.number().int().positive(),
});

const catalogSchema = z
  .array(robotTypeSchema)
  .min(1)
  .refine((types) => new Set(types.map((type) => type.name)).size === types.length, {
    message: 'Robot type names must be unique',
  });

export type RobotType = Readonly<z.infer<typeof robotTypeSchema>>;

// The single place robot types are defined; strategies never hardcode them.
export class RobotCatalog {
  private readonly byName: ReadonlyMap<string, RobotType>;

  private constructor(readonly types: readonly RobotType[]) {
    this.byName = new Map(types.map((type) => [type.name, type]));
  }

  // Throws on bad config since that is a deployment bug, not user input.
  static from(types: unknown): RobotCatalog {
    return new RobotCatalog(Object.freeze(catalogSchema.parse(types).map((t) => Object.freeze(t))));
  }

  get names(): readonly string[] {
    return this.types.map((type) => type.name);
  }

  find(name: string): RobotType | undefined {
    return this.byName.get(name);
  }
}

export const DEFAULT_CATALOG = RobotCatalog.from([
  { name: 'Bravo', hoursPerDay: 3, costPerDay: 2 },
  { name: 'Charlie', hoursPerDay: 5, costPerDay: 3 },
  { name: 'Delta', hoursPerDay: 8, costPerDay: 4 },
]);
