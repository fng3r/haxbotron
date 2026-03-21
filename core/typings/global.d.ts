import "child_process";

declare module "child_process" {
    interface ForkOptions {
        serialization?: "json" | "advanced";
    }
}

export {};
