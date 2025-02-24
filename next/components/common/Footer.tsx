'use client';

import React from 'react';
import { Container, styled } from '@mui/material';
import Copyright from './Footer.Copyright';

const StyledFooter = styled('footer')(({ theme }) => ({
    position: 'relative',
    bottom: 0,
    width: '100%',
    padding: theme.spacing(3, 2),
    marginTop: 'auto',
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
}));

export default function Footer() {
    return (
        <StyledFooter>
            <Container maxWidth="sm">
                <Copyright />
            </Container>
        </StyledFooter>
    );
}