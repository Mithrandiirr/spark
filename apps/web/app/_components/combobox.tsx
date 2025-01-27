"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from '@spark/api'
import { useState } from "react";
import Image from "next/image";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@spark/ui/form";
import { Check } from "lucide-react";
import { cn } from "@spark/ui";
import { Button } from "@spark/ui/button";
import { FormError } from "@spark/ui/form/form-error";
import type { Review } from "@prisma/client";
import { AnimeSchema } from "@spark/api";


const FormSchema = z.object({
  anime: AnimeSchema,
  content: z.string(),
  spoiler: z.boolean(),
  rating: z
    .string()
    .regex(/^[1-5]$/, "Rating must be a number between 1 and 5"),
});

export function ComboboxForm() {
  const [queryString, setQuery] = useState("");
  const {
    data: animesSearch,
  } = trpc.anime.searchAnimes.useQuery(queryString, {
    enabled: queryString.length > 0,
  });
  const utils = trpc.useUtils();
  const {
    mutate,
  } = trpc.reviews.createReview.useMutation({
    onSuccess(rev: Review) {
      utils.reviews.reviewList.invalidate();
      if (typeof window !== "undefined") {
        window.location.href = `/reviews/${rev.id}`;
      }
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      anime: { title: "", malId: "", imageJpg: "" },
      content: "",
      spoiler: false,
      rating: "",
    },
  });

  const handleSearch = (event) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log(data);
    mutate({
      anime: data.anime,
      content: data.content,
      rating: parseInt(data.rating),
      spoiler: data.spoiler,
    });
  };

  const handleSelect = (anime) => {
    form.setValue("anime", anime);
    form.setValue("anime.title", anime.title);
    console.log(anime);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-6xl mx-auto flex flex-row items-start gap-8"
      >
        <FormField
          control={form.control}
          name="anime"
          render={({ field }) => (
            <FormItem className="flex flex-col ">
              <FormLabel>Anime</FormLabel>
              <input
                type="text"
                className="text-2xl p-2 border border-gray-300 rounded bg-white/5"
                placeholder="Search animes"
                {...form.register("anime.title")}
                onChange={handleSearch}
              />
              {/* {!isFetching && <div className="text-2xl">Loading...</div>} */}
              {animesSearch && (
                <div className="flex flex-col gap-2 mt-2 bg-white/5 rounded-md">
                  {animesSearch.map((anime) => (
                    <div
                      key={anime.malId}
                      className="cursor-pointer p-2 flex flex-row gap-2 items-center hover:bg-white/20 rounded-md"
                      onClick={() => handleSelect(anime)}
                    >
                      <Image
                        src={anime.imageJpg || ""}
                        alt=""
                        className="w-20 h-24 rounded-md object-cover"
                        width={100}
                        height={100}
                      />
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-2xl ",
                          anime.malId.toString() ===
                            field.value?.malId.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {anime.title}
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
              <FormError />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex flex-col w-full">
                <FormLabel>Description</FormLabel>
                <textarea
                  className="text-2xl p-2 border border-gray-300 rounded bg-white/5"
                  placeholder="Enter description"
                  {...field}
                  {...form.register("content")}
                />
                <FormMessage />
                <FormError />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spoiler"
            render={({ field }) => (
              <FormItem className="flex flex-col w-full">
                <FormLabel>Spoiler?</FormLabel>
                <input
                  type="checkbox"
                  className="mt-2"
                  {...field}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                <FormMessage />
                <FormError />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="flex flex-col w-[400px]">
              <FormLabel>Rating</FormLabel>
              <input
                type="number"
                className="text-2xl p-2 border border-gray-300 rounded bg-white/5"
                placeholder="Enter rating (1-5)"
                {...field}
                {...form.register("rating")}
                min={1}
                max={5}
              />
              <FormMessage />
              <FormError />
            </FormItem>
          )}
        />
        <Button type="submit" variant={"secondary"}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
