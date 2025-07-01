'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChromePicker, ColorResult } from 'react-color';

import { CopyButton } from '../ui/copy-button';

import SnackBarNotification from '@/components/Notifications/SnackBarNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { isNumber } from '@/lib/numcheck';
import { mutations, queries } from '@/lib/queries/room';
import { TeamColours } from '@/lib/types/room';

type ModeSelect = 'avatar' | 'team1' | 'team2' | 'team3';

const convertHexToInt = (rrggbb: string) => {
  return parseInt(rrggbb, 16);
};

function drawTeamKitPreview(
  ctx: CanvasRenderingContext2D,
  options: {
    size: number;
    angle: string;
    teamColor1: string;
    teamColor2: string;
    teamColor3: string;
    textColor: string;
    text?: string;
  },
) {
  const { size, angle, teamColor1, teamColor2, teamColor3, textColor, text = 'HC' } = options;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 80;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw circle border
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#222';
  ctx.stroke();

  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.clip();

  // Convert hex colors to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };
  const colors = [teamColor1, teamColor2, teamColor3].map(hexToRgb);

  // Draw the middle band (band 2) as the background
  const baseAngle = -90;
  const angleDeg = (baseAngle + (parseInt(angle) || 0)) % 360;
  const angleRad = (angleDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);
  ctx.fillStyle = `rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;
  ctx.fillRect(-radius, -radius, 2 * radius, 2 * radius);
  ctx.restore();

  // Draw the top band (band 1)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);
  ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
  ctx.fillRect(-radius, -radius, 2 * radius, (2 * radius) / 3 + 1); // +1 for overlap
  ctx.restore();

  // Draw the bottom band (band 3)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);
  ctx.fillStyle = `rgb(${colors[2].r}, ${colors[2].g}, ${colors[2].b})`;
  ctx.fillRect(-radius, radius - (2 * radius) / 3 - 1, 2 * radius, (2 * radius) / 3 + 1); // +1 for overlap
  ctx.restore();

  ctx.restore(); // Remove clip

  // Draw border again for clarity
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#222';
  ctx.stroke();

  // Draw avatar text in the center
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.strokeText(text, centerX, centerY);
  ctx.fillText(text, centerX, centerY);
}

interface TeamKitManagerProps {
  teamName: 'red' | 'blue';
  initialColors: TeamColours;
  onApply: (colors: TeamColours) => void;
}

function TeamKitManager({ teamName, initialColors, onApply }: TeamKitManagerProps) {
  const [angle, setAngle] = useState(initialColors.angle.toString());
  const [textColor, setTextColor] = useState(`#${initialColors.textColour.toString(16)}`);
  const [teamColor1, setTeamColor1] = useState(`#${initialColors.teamColour1.toString(16)}`);
  const [teamColor2, setTeamColor2] = useState(`#${initialColors.teamColour2.toString(16)}`);
  const [teamColor3, setTeamColor3] = useState(`#${initialColors.teamColour3.toString(16)}`);

  const [modeSelect, setModeSelect] = useState<ModeSelect>('avatar');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const copyColorsCommandRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAngle(initialColors.angle.toString());
    setTextColor(`#${initialColors.textColour.toString(16)}`);
    setTeamColor1(`#${initialColors.teamColour1.toString(16)}`);
    setTeamColor2(`#${initialColors.teamColour2.toString(16)}`);
    setTeamColor3(`#${initialColors.teamColour3.toString(16)}`);
  }, [initialColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawTeamKitPreview(ctx, {
          size: 200,
          angle,
          teamColor1,
          teamColor2,
          teamColor3,
          textColor: textColor,
        });
      }
    }
  }, [angle, teamColor1, teamColor2, teamColor3, textColor]);

  const handleColorChange = (color: ColorResult) => {
    switch (modeSelect) {
      case 'avatar':
        setTextColor(color.hex);
        break;
      case 'team1':
        setTeamColor1(color.hex);
        break;
      case 'team2':
        setTeamColor2(color.hex);
        break;
      case 'team3':
        setTeamColor3(color.hex);
        break;
    }
  };

  const handleRestore = () => {
    const stored = localStorage.getItem(`_${teamName}TeamColors`);
    if (stored) {
      const colors = JSON.parse(stored);
      setAngle(colors.angle.toString());
      setTextColor(colors.textColor);
      setTeamColor1(colors.teamColor1);
      setTeamColor2(colors.teamColor2);
      setTeamColor3(colors.teamColor3);
    }
  };

  const handleApply = () => {
    const colors: TeamColours = {
      angle: isNumber(parseInt(angle)) ? parseInt(angle) : 0,
      textColour: convertHexToInt(textColor.substring(1)),
      teamColour1: convertHexToInt(teamColor1.substring(1)),
      teamColour2: convertHexToInt(teamColor2.substring(1)),
      teamColour3: convertHexToInt(teamColor3.substring(1)),
    };

    onApply(colors);

    // Save to localStorage
    localStorage.setItem(
      `_${teamName}TeamColors`,
      JSON.stringify({
        angle,
        textColor: textColor,
        teamColor1,
        teamColor2,
        teamColor3,
      }),
    );
  };

  const currentColor = useMemo(() => {
    switch (modeSelect) {
      case 'avatar':
        return textColor;
      case 'team1':
        return teamColor1;
      case 'team2':
        return teamColor2;
      case 'team3':
        return teamColor3;
      default:
        return textColor;
    }
  }, [modeSelect, textColor, teamColor1, teamColor2, teamColor3]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col justify-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="angle">Angle</Label>
            <Input id="angle" type="number" value={angle} onChange={(e) => setAngle(e.target.value)} className="w-20" />
            <span>°</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={modeSelect === 'avatar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModeSelect('avatar')}
          >
            Avatar
          </Button>
          <Button
            variant={modeSelect === 'team1' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModeSelect('team1')}
          >
            First
          </Button>
          <Button
            variant={modeSelect === 'team2' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModeSelect('team2')}
          >
            Second
          </Button>
          <Button
            variant={modeSelect === 'team3' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModeSelect('team3')}
          >
            Third
          </Button>
        </div>

        <div className="flex gap-4">
          <ChromePicker disableAlpha color={currentColor} onChange={handleColorChange} />
          <div className="flex flex-col gap-2">
            <Label>Preview</Label>
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="border rounded-lg"
              style={{ width: '200px', height: '200px' }}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Angle</TableHead>
              <TableHead>Avatar</TableHead>
              <TableHead>First</TableHead>
              <TableHead>Second</TableHead>
              <TableHead>Third</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{angle}°</TableCell>
              <TableCell>{textColor}</TableCell>
              <TableCell>{teamColor1}</TableCell>
              <TableCell>{teamColor2}</TableCell>
              <TableCell>{teamColor3}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApply}>
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRestore}>
                    Restore
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="flex items-center gap-2 mt-2">
          <Input
            type="text"
            readOnly
            ref={copyColorsCommandRef}
            value={`/colors ${teamName} ${angle} ${textColor.replace('#', '')} ${teamColor1.replace('#', '')} ${teamColor2.replace('#', '')} ${teamColor3.replace('#', '')}`}
            className="w-90"
          />
          <CopyButton htmlRef={copyColorsCommandRef} />
        </div>
      </div>
    </>
  );
}

export default function TeamKits({ ruid }: { ruid: string }) {
  const { data: teamColorsData, error: teamColorsError } = queries.getTeamColours(ruid);
  const setTeamColoursMutation = mutations.setTeamColours();

  const [selectedTeam, setSelectedTeam] = useState<'red' | 'blue'>('red');

  if (teamColorsError) {
    SnackBarNotification.error(teamColorsError.message);
  }

  const redTeamColors = teamColorsData?.red ?? {
    angle: 0,
    textColour: 0xffffff,
    teamColour1: 0xe66e55,
    teamColour2: 0xe66e55,
    teamColour3: 0xe66e55,
  };

  const blueTeamColors = teamColorsData?.blue ?? {
    angle: 0,
    textColour: 0xffffff,
    teamColour1: 0x5a89e5,
    teamColour2: 0x5a89e5,
    teamColour3: 0x5a89e5,
  };

  const handleApplyColors = (colors: TeamColours) => {
    setTeamColoursMutation.mutate(
      {
        ruid,
        team: selectedTeam === 'blue' ? 2 : 1,
        ...colors,
      },
      {
        onSuccess: () => {
          SnackBarNotification.success(`Successfully set colors of the ${selectedTeam} team.`);
        },
        onError: (error: Error) => {
          SnackBarNotification.error(error.message);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Kits</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="team">Select team</Label>
            <RadioGroup
              id="team"
              name="team"
              value={selectedTeam}
              className="flex items-center space-x-4"
              onValueChange={(value) => setSelectedTeam(value as 'red' | 'blue')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="red" id="red" />
                <Label htmlFor="red">Red</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blue" id="blue" />
                <Label htmlFor="blue">Blue</Label>
              </div>
            </RadioGroup>
          </div>
          <Separator />
          {selectedTeam === 'red' ? (
            <TeamKitManager teamName={'red'} initialColors={redTeamColors} onApply={handleApplyColors} />
          ) : (
            <TeamKitManager teamName={'blue'} initialColors={blueTeamColors} onApply={handleApplyColors} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
