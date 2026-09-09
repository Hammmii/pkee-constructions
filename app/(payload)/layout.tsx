import config from "@/payload.config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import { importMap } from "./admin/importMap.js";

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  return handleServerFunctions({ config, importMap, ...args });
};

export const metadata = {
  description: "PKEE Constructions content studio",
  title: "PKEE Studio",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
