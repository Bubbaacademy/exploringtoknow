/* THIS FILE IS THE STANDARD PAYLOAD 3 ADMIN MOUNT (do not edit by hand). */
import config from '@payload-config';
import '@payloadcms/next/css';
import '../../admin-theme.css'; // ExploringToKnow native admin branding (scoped to /admin route group)
import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import React from 'react';
import { importMap } from './admin/importMap.js';

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
