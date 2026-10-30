# BMC-UI

The web interface for configuring a Turing Pi board's baseboard management controller.

## Language

**BMC**:
The baseboard management controller on a Turing Pi board. This UI configures that board.

**Node**:
One of the four compute-module slots on the board.

**USB Flash mode**:
The USB route that puts a module into flashing mode over the USB_OTG port.
_Avoid_: flash

**Node image**:
An OS image installed onto a node.
_Avoid_: firmware, flash

**BMC firmware**:
The `.tpu` package that upgrades the BMC itself.
_Avoid_: node image, flash

**Session token**:
The bearer credential returned by authenticate.
_Avoid_: password, cookie

**Remote file**:
An `http` or `https` address the BMC fetches for a node image or a BMC firmware package.
_Avoid_: upload, BMC-local path
