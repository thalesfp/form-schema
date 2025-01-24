import { z } from "zod";
import { BaseForm } from "../src/base-form";

class TestForm extends BaseForm<typeof schema> {}

const baseSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
});

const schema = baseSchema
  .superRefine((data, ctx) => {
    if (data.name.toLowerCase().includes("admin")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name cannot contain 'admin'",
        path: ["name"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    fullName: `${data.name} Doe`,
  }));

describe("BaseForm", () => {
  let form: TestForm;

  beforeEach(() => {
    form = new TestForm(schema, {
      name: "John",
      email: "john@example.com",
      age: 25,
    });
  });

  describe("zod effects", () => {
    it("should handle transformed data", () => {
      const result = form.validate();
      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
        age: 25,
        fullName: "John Doe",
      });
    });

    it("should handle superRefine validation", () => {
      form.setValue("name", "admin_user");
      const result = form.validate();
      expect(result).toBeNull();
      expect(form.errors.name).toContain("Name cannot contain 'admin'");
    });
  });

  describe("initialization", () => {
    it("should initialize with valid data", () => {
      expect(form.data).toEqual({
        name: "John",
        email: "john@example.com",
        age: 25,
      });
    });

    it("should throw error for invalid schema", () => {
      // @ts-expect-error
      expect(() => new TestForm(z.string())).toThrow();
    });
  });

  describe("validation", () => {
    it("should validate all fields successfully", () => {
      const result = form.validate();
      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
        age: 25,
        fullName: "John Doe",
      });
      expect(form.errors).toEqual({});
    });

    it("should collect all validation errors", () => {
      form.setValue("name", "Jo");
      form.setValue("email", "invalid-email");
      form.setValue("age", 15);

      const result = form.validate();
      expect(result).toBeNull();
      expect(form.errors.name).toBeDefined();
      expect(form.errors.email).toBeDefined();
      expect(form.errors.age).toBeDefined();
    });

    it("should remove field error when validation passes", () => {
      form.setValue("name", "Jo");
      form.validateField("name");
      expect(form.errors.name).toBeDefined();

      form.setValue("name", "John");
      form.validateField("name");
      expect(form.errors.name).toBeUndefined();
    });

    it("should validate single field", () => {
      form.setValue("name", "Jo");
      form.validateField("name");
      expect(form.errors.name).toBeDefined();
      expect(Object.keys(form.errors)).toHaveLength(1);
    });
  });

  describe("form state", () => {
    it("should track dirty state", () => {
      expect(form.isDirty).toBeFalsy();
      form.setValue("name", "Jane");
      expect(form.isDirty).toBeTruthy();
    });

    it("should track field dirty state", () => {
      expect(form.isFieldDirty("name")).toBeFalsy();
      form.setValue("name", "Jane");
      expect(form.isFieldDirty("name")).toBeTruthy();
    });

    it("should reset to initial values", () => {
      form.setValue("name", "Jane");
      form.reset();
      expect(form.data).toEqual({
        name: "John",
        email: "john@example.com",
        age: 25,
      });
      expect(form.isDirty).toBeFalsy();
    });

    it("should clear all values", () => {
      form.clear();
      expect(form.data).toEqual({});
    });
  });

  describe("error handling", () => {
    it("should set and clear errors", () => {
      form.setError("name", "Custom error");
      expect(form.errors.name).toContain("Custom error");
      form.clearErrors();
      expect(form.errors).toEqual({});
    });
  });

  describe("validation modes", () => {
    it("should validate on blur when configured", () => {
      form = new TestForm(schema, {}, { validationMode: "onBlur" });
      form.setValue("name", "Jo");
      form.handleBlur("name");
      expect(form.errors.name).toBeDefined();
    });

    it("should validate on change when configured", () => {
      form = new TestForm(schema, {}, { validationMode: "onChange" });
      form.setValue("name", "Jo");
      expect(form.errors.name).toBeDefined();
    });

    it("should not validate on change by default", () => {
      form.setValue("name", "Jo");
      expect(form.errors.name).toBeUndefined();
    });
  });

  describe("initial values", () => {
    it("should update initial values", () => {
      form.setInitialValues({ name: "Jane" });
      expect(form.isDirty).toBeFalsy();
      form.setValue("name", "John");
      expect(form.isDirty).toBeTruthy();
    });
  });
});
