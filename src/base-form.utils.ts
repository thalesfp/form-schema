import { z } from "zod";

function isZodObject(schema: z.ZodTypeAny): schema is z.ZodObject<any> {
  return schema instanceof z.ZodObject;
}

function isZodEffects(schema: z.ZodTypeAny): schema is z.ZodEffects<any> {
  return schema instanceof z.ZodEffects;
}

export function getObjectSchema(schema: z.ZodTypeAny): z.ZodObject<any> | null {
  if (isZodObject(schema)) {
    return schema;
  }

  if (isZodEffects(schema)) {
    return getObjectSchema(schema._def.schema);
  }

  return null;
}
