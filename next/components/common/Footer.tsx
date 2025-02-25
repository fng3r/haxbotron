'use client';

import React from 'react';

import Copyright from './Footer.Copyright';
import { Container } from '@mui/material';

export default function Footer() {
  return (
    <footer className="relative bottom-0 mt-auto w-full bg-gray-100 p-6 dark:bg-gray-800">
      <Container maxWidth="sm">
        <Copyright />
      </Container>
    </footer>
  );
}
