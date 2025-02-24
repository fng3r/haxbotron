'use client';

import client from "@/lib/client";
import { Badge, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import { PowerSettingsNew as PowerSettingsNewIcon } from "@mui/icons-material";

export default function LogoutButton() {
    const router = useRouter();

    const onClickLogout = async () => {
        try {
          const result = await client.delete('/api/v1/auth');
          if (result.status === 204) {
            router.push('/');
          }
        } catch { }
    }

    return (
        <IconButton color="inherit" onClick={onClickLogout}>
            <Badge color="secondary">
                <PowerSettingsNewIcon />
            </Badge>
        </IconButton>
    );
}