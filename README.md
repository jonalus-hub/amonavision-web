# AmonaVision – website

The website of AmonaVision, a digital photo frame for older people without a
smartphone: they see the family's photos, videos and voice messages, and reply
with their own voice at the press of a button.

**Live:** https://jonalus-hub.github.io/amonavision-web/ (German and English)

The page explains the idea and includes a **demo you can use**: the frame with
its four buttons next to the family's group chat. Send a photo, play a voice
message on the frame, hold "Reply" and speak, and see Grandma's reply arrive in
the chat.

## The demo

The demo is a simplified recreation of the real frame in plain JavaScript
(`js/demo.js`). The real frame runs on a Raspberry Pi; its code is in
[jonalus-hub/amonavision-frame](https://github.com/jonalus-hub/amonavision-frame).
The demo copies the frame's behaviour: the four buttons, the "Play"/"Reply" hints
above them, the slideshow, recording while the button is held, and voice notes that
pair with a photo by replying to it in the chat.

Everything stays in the visitor's browser. Photos, videos and recordings a visitor
adds are never uploaded. The microphone is only used when the visitor switches it
on; otherwise a sample voice plays Grandma's reply.

## Privacy

The page sets no cookies and loads nothing from other servers: the font, the
media and the scripts are all served from this repository. A Content Security
Policy enforces that. The language choice is kept in the browser's local
storage.

## Run it locally

Any static web server works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The microphone needs HTTPS or localhost.

## Credits

- **Photos:** [StockSnap](https://stocksnap.io), CC0 1.0 (found through
  [Openverse](https://openverse.org)). The people shown are not AmonaVision users.
- **Video:** "Family making a video call on smartphone" from
  [Mixkit](https://mixkit.co/free-stock-video/family-making-a-video-call-on-smartphone-4523/),
  Mixkit Stock Video Free License.
- **Voices** (synthetic, no real person's voice):
  - English: [Kokoro TTS](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0).
  - German: [Piper](https://github.com/OHF-Voice/piper1-gpl) with the
    [Thorsten](https://github.com/thorstenMueller/Thorsten-Voice) and
    [Kerstin](https://github.com/rhasspy/dataset-voice-kerstin) voices (CC0 datasets).
- **Typeface:** [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans),
  SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
- **Frame surface:** `assets/frame-wood.jpg` is a photo of a real AmonaVision frame.
