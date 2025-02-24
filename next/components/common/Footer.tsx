'use client';

import React from 'react';
import { Container } from '@mui/material';
import Copyright from './Footer.Copyright';

export default function Footer() {
    return (
        <footer className="relative bottom-0 w-full p-6 mt-auto bg-gray-100 dark:bg-gray-800">
            <Container maxWidth="sm">
                <Copyright />
            </Container>
        </footer>
    );
}