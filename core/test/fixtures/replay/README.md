These zero-frame HBR2 v3 fixtures were captured using the public
`startRecording()` / `stopRecording()` API of the unmodified `haxball.js@5.1.0`
engine, with `noPlayer: true` and no connected players.

- `classic.hbr2`: the initial native Classic stadium, represented by a built-in ID.
- `custom.hbr2`: `custom.hbs`, recorded inside `onStadiumChange` immediately after
  loading the map. Includes straight, curved and invisible segments, goals and
  a hockey background with a custom color.

The binary fixtures ensure decoding compatibility is tested against actual
engine output, rather than a replay produced by the decoder under test.
