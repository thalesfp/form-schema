import deepEqual from "fast-deep-equal";
import { z } from "zod";

import { getObjectSchema } from "./base-form.utils";

type FormErrors<T> = {
  [K in keyof T]?: string[];
};

type ValidationMode = "onSubmit" | "onBlur" | "onChange";

export interface FormConfig {
  validationMode: ValidationMode;
}

const defaultConfig: FormConfig = {
  validationMode: "onSubmit",
};

interface Form<T extends z.ZodTypeAny> {
  data: z.infer<T>;
  errors: FormErrors<z.infer<T>>;
  schema: T;
  config: FormConfig;
  isDirty: boolean;
  validate(): z.infer<T> | null;
  validateField(field: keyof z.infer<T>): void;
  clearErrors(): void;
  setError(field: keyof z.infer<T>, message: string): void;
  clear(): void;
  reset(): void;
  setValue<K extends keyof z.infer<T>>(field: K, value: z.infer<T>[K]): void;
  handleBlur(field: keyof z.infer<T>): void;
  handleChange(field: keyof z.infer<T>): void;
  isFieldDirty(field: keyof z.infer<T>): boolean;
}

export abstract class BaseForm<T extends z.ZodTypeAny> implements Form<T> {
  data: z.infer<T>;
  errors: FormErrors<z.infer<T>> = {};
  schema: T;
  objectSchema: z.ZodObject<any>;
  config: FormConfig;
  private readonly initialData: z.infer<T>;

  constructor(
    schema: T,
    initialData: Partial<z.infer<T>> = {},
    config: Partial<FormConfig> = {}
  ) {
    const objectSchema = getObjectSchema(schema);

    if (!objectSchema) {
      throw new Error(
        "Schema must be either a ZodObject or a ZodEffects wrapping a ZodObject"
      );
    }

    this.objectSchema = objectSchema;
    this.schema = schema;
    this.data = initialData;
    this.initialData = { ...this.data };
    this.config = { ...defaultConfig, ...config };
  }

  get isDirty(): boolean {
    return !deepEqual(this.data, this.initialData);
  }

  validateField(field: keyof z.infer<T>): void {
    const fieldSchema = this.objectSchema.shape[field];
    const schema = z.object({ [field]: fieldSchema });
    const result = schema.safeParse({ [field]: this.data[field] });

    if (!result.success) {
      this.errors[field] = result.error.errors.map((error) => error.message);
    } else {
      delete this.errors[field];
    }
  }

  validate(): z.infer<T> | null {
    const result = this.schema.safeParse(this.data);

    if (!result.success) {
      this.errors = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0] as keyof z.infer<T>;
        if (!this.errors[path]) {
          this.errors[path] = [];
        }
        this.errors[path]?.push(error.message);
      });
      return null;
    }

    this.clearErrors();
    return result.data;
  }

  setValue<K extends keyof z.infer<T>>(field: K, value: z.infer<T>[K]): void {
    this.data[field] = value;
    this.handleChange(field);
  }

  setInitialValues(values: Partial<z.infer<T>>): void {
    Object.assign(this.data, values);
    Object.assign(this.initialData, values);
  }

  handleBlur(field: keyof z.infer<T>): void {
    if (this.config.validationMode === "onBlur") {
      this.validateField(field);
    }
  }

  handleChange(field: keyof z.infer<T>): void {
    if (this.config.validationMode === "onChange") {
      this.validateField(field);
    }
  }

  clearErrors(): void {
    this.errors = {};
  }

  setError(field: keyof z.infer<T>, message: string): void {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field]?.push(message);
  }

  clear(): void {
    Object.keys(this.data).forEach((key) => {
      delete this.data[key];
    });
    this.clearErrors();
  }

  reset(): void {
    const resetData = { ...this.initialData };

    Object.keys(this.data).forEach((key) => {
      delete this.data[key];
    });

    Object.assign(this.data, resetData);
    this.clearErrors();
  }

  isFieldDirty(field: keyof z.infer<T>): boolean {
    return !deepEqual(this.data[field], this.initialData[field]);
  }
}
