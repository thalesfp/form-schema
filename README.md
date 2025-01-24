# Base Form Schema

A TypeScript-first form management library designed to work seamlessly with Valtio and Zod. Built as a lightweight alternative to React Hook Form, focusing on schema validation and state management.

## Features

- 🎯 Built for Valtio - Optimized for proxy-based state management
- 📝 Zod Schema Integration - Type-safe form validation
- 🔄 Multiple Validation Modes - onChange, onBlur, or onSubmit
- 💪 TypeScript-first - Full type safety and excellent DX
- 🪶 Lightweight - Zero dependencies beyond Valtio and Zod
- 🧩 Extensible - Easily extendable with custom validation logic

## Installation

```bash
npm install base-form-schema valtio zod
# or
yarn add base-form-schema valtio zod
```

## Quick Start

```typescript
import { proxy } from 'valtio';
import { z } from 'zod';
import { BaseForm } from 'base-form-schema';

// Define your schema
const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

// Create your form class
class LoginForm extends BaseForm<typeof schema> {
  get fullName(): string {
    return `${this.data.firstName} ${this.data.lastName}`.trim();
  }
}

// Create your form state
const formState = proxy(new LoginForm(schema));

// Use in your component
function LoginComponent() {
  const form = useSnapshot(formState);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (data) {
      // Valid form data
      console.log(data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.data.firstName}
        onChange={e => form.setValue('firstName', e.target.value)}
        onBlur={() => form.handleBlur('firstName')}
        placeholder="First Name"
      />
      {form.errors.firstName?.map(error => (
        <span key={error}>{error}</span>
      ))}

      <input
        value={form.data.lastName}
        onChange={e => form.setValue('lastName', e.target.value)}
        onBlur={() => form.handleBlur('lastName')}
        placeholder="Last Name"
      />
      {form.errors.lastName?.map(error => (
        <span key={error}>{error}</span>
      ))}

      <input
        value={form.data.email}
        onChange={e => form.setValue('email', e.target.value)}
        onBlur={() => form.handleBlur('email')}
        placeholder="Email"
      />
      {form.errors.email?.map(error => (
        <span key={error}>{error}</span>
      ))}

      <div>Full Name: {form.fullName}</div>
      {/* ... */}
    </form>
  );
}
```

## Advanced Usage

### Custom Validation with Zod Effects

```typescript
const schema = z.effect(
  z.object({
    username: z.string()
  })
)
.superRefine((data, ctx) => {
  if (data.username.includes('admin')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Username cannot contain 'admin'"
    });
  }
})
.transform(data => ({
  ...data,
  displayName: `@${data.username}`
}));
```

### Different Validation Modes

```typescript
// Validate on input change
const form = new LoginForm(schema, {}, { validationMode: 'onChange' });

// Validate on field blur
const form = new LoginForm(schema, {}, { validationMode: 'onBlur' });

// Validate only on submit (default)
const form = new LoginForm(schema, {}, { validationMode: 'onSubmit' });
```

### Form State Management

```typescript
// Check if form is dirty
console.log(form.isDirty);

// Check if specific field is dirty
console.log(form.isFieldDirty('email'));

// Reset form to initial values
form.reset();

// Clear form
form.clear();

// Set custom error
form.setError('email', 'Email already exists');
```
