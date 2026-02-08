"use client";

import { MindElixirCtor } from "mind-elixir";

// Custom dynamic import to avoid SSR issues
export default (await import("mind-elixir")
    .then((module) => module.default)
    // Silence errors during SSR
    .catch((error) => {})) as MindElixirCtor;
