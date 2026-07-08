"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export function NewsletterForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit() {
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 sm:flex-row">
      <input
        {...register("email")}
        type="email"
        placeholder="your@email.com"
        className="h-11 flex-1 rounded-2xl border border-border bg-surface px-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <Button type="submit" variant="accent" size="sm">
        Subscribe
      </Button>
      {errors.email ? (
        <p className="text-xs text-error sm:absolute sm:mt-12">{errors.email.message}</p>
      ) : null}
      {isSubmitSuccessful ? (
        <p className="text-xs text-success">Welcome to the list.</p>
      ) : null}
    </form>
  );
}
