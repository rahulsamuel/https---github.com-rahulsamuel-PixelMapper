"use client";

import { usePixelMapper } from "@/contexts/pixel-mapper-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Grid3x3 } from "lucide-react";

const dimensionsSchema = z.object({
  tileWidth: z.coerce.number().min(1, "Must be > 0"),
  tileHeight: z.coerce.number().min(1, "Must be > 0"),
  screenWidth: z.coerce.number().min(1, "Must be > 0"),
  screenHeight: z.coerce.number().min(1, "Must be > 0"),
});

type DimensionsForm = z.infer<typeof dimensionsSchema>;

export function DimensionControls() {
  const { dimensions, setDimensions } = usePixelMapper();

  const form = useForm<DimensionsForm>({
    resolver: zodResolver(dimensionsSchema),
    defaultValues: dimensions,
  });

  function onSubmit(values: DimensionsForm) {
    setDimensions(values);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Grid3x3 className="size-5" />
          <CardTitle>Dimensions</CardTitle>
        </div>
        <CardDescription>
          Define the size of your LED tiles and the overall screen grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tileWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tile Width (px)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tileHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tile Height (px)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="screenWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Screen Width (tiles)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="screenHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Screen Height (tiles)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              Apply Dimensions
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
