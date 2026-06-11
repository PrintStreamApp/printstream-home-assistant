# PrintStream for Home Assistant

Home Assistant integration for [PrintStream](https://github.com/PrintStreamApp/printstream), the self-hosted print farm manager for Bambu Lab printers.

Connects to your PrintStream server and exposes your printers in Home Assistant:

- **Sensors** — printer state, current job, progress, layer, remaining time, temperatures, AMS details
- **Binary sensors** — printing, online, error states
- **Cameras** — live printer camera feeds relayed through PrintStream
- **Images** — current job cover/preview images
- **Media source** — browse finished-print snapshots
- **Lovelace cards** — bundled printer cards for dashboards

## Requirements

- A running PrintStream server reachable from Home Assistant
- A PrintStream API token (create one in PrintStream under Settings)

## Installation

### HACS (recommended)

1. In HACS, open **Integrations**, then choose **Custom repositories** from the menu.
2. Add `https://github.com/PrintStreamApp/printstream-home-assistant` with category **Integration**.
3. Install **PrintStream** and restart Home Assistant.

### Manual

Copy `custom_components/printstream` into your Home Assistant `config/custom_components/` directory and restart Home Assistant.

## Configuration

1. Go to **Settings → Devices & Services → Add Integration**.
2. Search for **PrintStream**.
3. Enter a name, your PrintStream server URL, and an access token.

Printers managed by PrintStream are discovered automatically and appear as devices.

## Issues

Please report problems at <https://github.com/PrintStreamApp/printstream-home-assistant/issues>.
