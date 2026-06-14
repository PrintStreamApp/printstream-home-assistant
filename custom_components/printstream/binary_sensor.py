"""Binary sensor entities for the PrintStream bridge."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import PrintStreamBridgeCoordinator
from .entity import (
    PrintStreamAmsEntity,
    PrintStreamPrinterEntity,
    ams_unique_id,
    ams_slots,
    printer_unique_id,
    printer_ams_setting_available,
    printer_has_any_light,
    printer_print_option_supported,
    printer_supports_door_sensor,
)


def _always_true(_: dict[str, Any]) -> bool:
    return True


@dataclass(frozen=True, slots=True)
class PrinterBinarySensorDescription:
    suffix: str
    name: str
    value_fn: Callable[[dict[str, Any]], bool | None]
    predicate: Callable[[dict[str, Any]], bool] = _always_true
    device_class: BinarySensorDeviceClass | None = None
    entity_category: EntityCategory | None = None
    entity_registry_enabled_default: bool = True


@dataclass(frozen=True, slots=True)
class AmsBinarySensorDescription:
    suffix: str
    name: str
    value_fn: Callable[[dict[str, Any]], bool | None]
    predicate: Callable[[dict[str, Any]], bool] = _always_true
    device_class: BinarySensorDeviceClass | None = None
    entity_category: EntityCategory | None = None
    entity_registry_enabled_default: bool = True


@dataclass(frozen=True, slots=True)
class AmsSlotBinarySensorDescription:
    suffix: str
    name: str
    value_fn: Callable[[dict[str, Any]], bool | None]
    device_class: BinarySensorDeviceClass | None = None
    entity_category: EntityCategory | None = None
    entity_registry_enabled_default: bool = True


_PRINTER_BINARY_SENSOR_DESCRIPTIONS: tuple[PrinterBinarySensorDescription, ...] = (
    PrinterBinarySensorDescription(
        "door_open",
        "Door Open",
        lambda printer: _bool_value(printer.get("doorOpen")),
        predicate=printer_supports_door_sensor,
        device_class=BinarySensorDeviceClass.DOOR,
    ),
    PrinterBinarySensorDescription(
        "sd_card_present",
        "SD Card Present",
        lambda printer: _bool_value(printer.get("sdCardPresent")),
        predicate=lambda printer: printer.get("sdCardPresent") is not None,
    ),
    PrinterBinarySensorDescription(
        "light_on",
        "Light On",
        lambda printer: _bool_value(printer.get("lightOn")),
        predicate=printer_has_any_light,
    ),
    PrinterBinarySensorDescription(
        "ai_monitoring",
        "AI Monitoring",
        lambda printer: _print_option_enabled(printer, "aiMonitoring"),
        predicate=lambda printer: printer_print_option_supported(printer, "aiMonitoring"),
    ),
    PrinterBinarySensorDescription(
        "spaghetti_detection",
        "Spaghetti Detection",
        lambda printer: _print_option_enabled(printer, "spaghettiDetection"),
        predicate=lambda printer: printer_print_option_supported(printer, "spaghettiDetection"),
    ),
    PrinterBinarySensorDescription(
        "purge_chute_pileup_detection",
        "Purge Chute Pileup Detection",
        lambda printer: _print_option_enabled(printer, "purgeChutePileupDetection"),
        predicate=lambda printer: printer_print_option_supported(printer, "purgeChutePileupDetection"),
    ),
    PrinterBinarySensorDescription(
        "nozzle_clumping_detection",
        "Nozzle Clumping Detection",
        lambda printer: _print_option_enabled(printer, "nozzleClumpingDetection"),
        predicate=lambda printer: printer_print_option_supported(printer, "nozzleClumpingDetection"),
    ),
    PrinterBinarySensorDescription(
        "air_printing_detection",
        "Air Printing Detection",
        lambda printer: _print_option_enabled(printer, "airPrintingDetection"),
        predicate=lambda printer: printer_print_option_supported(printer, "airPrintingDetection"),
    ),
    PrinterBinarySensorDescription(
        "first_layer_inspection",
        "First Layer Inspection",
        lambda printer: _print_option_enabled(printer, "firstLayerInspection"),
        predicate=lambda printer: printer_print_option_supported(printer, "firstLayerInspection"),
    ),
    PrinterBinarySensorDescription(
        "auto_recovery",
        "Auto Recovery",
        lambda printer: _print_option_enabled(printer, "autoRecovery"),
        predicate=lambda printer: printer_print_option_supported(printer, "autoRecovery"),
    ),
    PrinterBinarySensorDescription(
        "prompt_sound",
        "Prompt Sound",
        lambda printer: _print_option_enabled(printer, "promptSound"),
        predicate=lambda printer: printer_print_option_supported(printer, "promptSound"),
    ),
    PrinterBinarySensorDescription(
        "filament_tangle_detection",
        "Filament Tangle Detection",
        lambda printer: _print_option_enabled(printer, "filamentTangleDetection"),
        predicate=lambda printer: printer_print_option_supported(printer, "filamentTangleDetection"),
    ),
    PrinterBinarySensorDescription(
        "ams_detect_on_insert",
        "AMS Detect On Insert",
        lambda printer: _ams_setting_value(printer, "detectOnInsert"),
        predicate=lambda printer: printer_ams_setting_available(printer, "detectOnInsert"),
    ),
    PrinterBinarySensorDescription(
        "ams_detect_on_powerup",
        "AMS Detect On Power-up",
        lambda printer: _ams_setting_value(printer, "detectOnPowerup"),
        predicate=lambda printer: printer_ams_setting_available(printer, "detectOnPowerup"),
    ),
    PrinterBinarySensorDescription(
        "ams_remain_enabled",
        "AMS Remain Enabled",
        lambda printer: _ams_setting_value(printer, "remainEnabled"),
        predicate=lambda printer: printer_ams_setting_available(printer, "remainEnabled"),
    ),
    PrinterBinarySensorDescription(
        "ams_auto_refill",
        "AMS Auto Refill",
        lambda printer: _ams_setting_value(printer, "autoRefill"),
        predicate=lambda printer: printer_ams_setting_available(printer, "autoRefill"),
    ),
    PrinterBinarySensorDescription(
        "filament_backup_supported",
        "Filament Backup Supported",
        lambda printer: _ams_setting_value(printer, "supportFilamentBackup"),
        predicate=lambda printer: _ams_setting_value(printer, "supportFilamentBackup") is True,
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
)


_AMS_BINARY_SENSOR_DESCRIPTIONS: tuple[AmsBinarySensorDescription, ...] = (
    AmsBinarySensorDescription(
        "support_drying",
        "Support Drying",
        lambda ams: _bool_value(ams.get("supportDrying")),
        predicate=lambda ams: bool(ams.get("supportDrying")),
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
)


_AMS_SLOT_BINARY_SENSOR_DESCRIPTIONS: tuple[AmsSlotBinarySensorDescription, ...] = (
    AmsSlotBinarySensorDescription("active", "Active", lambda slot: _bool_value(slot.get("active"))),
    AmsSlotBinarySensorDescription("reading", "Reading", lambda slot: _bool_value(slot.get("isReading"))),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensor entities from a config entry."""
    coordinator: PrintStreamBridgeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    known_entities: set[str] = set()

    @callback
    def _async_sync_entities() -> None:
        new_entities: list[BinarySensorEntity] = []

        for printer in coordinator.data.printers:
            printer_id = printer.get("id")
            if not isinstance(printer_id, str):
                continue

            key = f"printer:{printer_id}:online"
            if key not in known_entities:
                known_entities.add(key)
                new_entities.append(PrintStreamPrinterOnlineBinarySensor(coordinator, entry, printer_id))

            for description in _PRINTER_BINARY_SENSOR_DESCRIPTIONS:
                if not description.predicate(printer):
                    continue
                printer_key = f"printer:{printer_id}:{description.suffix}"
                if printer_key in known_entities:
                    continue
                known_entities.add(printer_key)
                new_entities.append(PrintStreamPrinterMappedBinarySensor(coordinator, entry, printer_id, description))

            for ams in printer.get("ams", []):
                if not isinstance(ams, dict):
                    continue
                ams_id = ams.get("id")
                if not isinstance(ams_id, str):
                    continue
                if bool(ams.get("supportDrying")):
                    ams_key = f"ams:{ams_id}:drying"
                    if ams_key not in known_entities:
                        known_entities.add(ams_key)
                        new_entities.append(PrintStreamAmsDryingBinarySensor(coordinator, entry, ams_id))

                for description in _AMS_BINARY_SENSOR_DESCRIPTIONS:
                    if not description.predicate(ams):
                        continue
                    extra_ams_key = f"ams:{ams_id}:{description.suffix}"
                    if extra_ams_key in known_entities:
                        continue
                    known_entities.add(extra_ams_key)
                    new_entities.append(PrintStreamAmsMappedBinarySensor(coordinator, entry, ams_id, description))

                for slot in ams_slots(ams):
                    slot_index = slot.get("slot")
                    if not isinstance(slot_index, int):
                        continue
                    for description in _AMS_SLOT_BINARY_SENSOR_DESCRIPTIONS:
                        slot_key = f"ams:{ams_id}:slot:{slot_index}:{description.suffix}"
                        if slot_key in known_entities:
                            continue
                        known_entities.add(slot_key)
                        new_entities.append(
                            PrintStreamAmsSlotMappedBinarySensor(
                                coordinator,
                                entry,
                                ams_id,
                                slot_index,
                                description,
                            )
                        )

        if new_entities:
            async_add_entities(new_entities)

    _async_sync_entities()
    entry.async_on_unload(coordinator.async_add_listener(_async_sync_entities))


class PrintStreamPrinterOnlineBinarySensor(PrintStreamPrinterEntity, BinarySensorEntity):
    """Connectivity binary sensor for a printer."""

    _attr_name = "Online"
    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, "online")

    @property
    def is_on(self) -> bool | None:
        printer = self.printer
        if not printer:
            return None
        return bool(printer.get("online"))


class PrintStreamAmsDryingBinarySensor(PrintStreamAmsEntity, BinarySensorEntity):
    """Drying-state binary sensor for an AMS unit."""

    _attr_name = "Drying"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, "drying")

    @property
    def is_on(self) -> bool | None:
        ams = self.ams
        if not ams:
            return None
        return bool(ams.get("dryingActive"))


class PrintStreamPrinterMappedBinarySensor(PrintStreamPrinterEntity, BinarySensorEntity):
    """Generic printer boolean sensor backed by bridge state."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        printer_id: str,
        description: PrinterBinarySensorDescription,
    ) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._description = description
        self._attr_name = description.name
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, description.suffix)
        self._attr_device_class = description.device_class
        self._attr_entity_category = description.entity_category

    @property
    def is_on(self) -> bool | None:
        printer = self.printer
        if not printer:
            return None
        return self._description.value_fn(printer)


class PrintStreamAmsMappedBinarySensor(PrintStreamAmsEntity, BinarySensorEntity):
    """Generic AMS boolean sensor backed by bridge state."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        ams_id: str,
        description: AmsBinarySensorDescription,
    ) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._description = description
        self._attr_name = description.name
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, description.suffix)
        self._attr_device_class = description.device_class
        self._attr_entity_category = description.entity_category

    @property
    def is_on(self) -> bool | None:
        ams = self.ams
        if not ams:
            return None
        return self._description.value_fn(ams)


class PrintStreamAmsSlotMappedBinarySensor(PrintStreamAmsEntity, BinarySensorEntity):
    """Generic AMS slot boolean sensor."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        ams_id: str,
        slot_index: int,
        description: AmsSlotBinarySensorDescription,
    ) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._slot_index = slot_index
        self._description = description
        self._attr_name = f"Tray {slot_index + 1} {description.name}"
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, f"tray_{slot_index + 1}_{description.suffix}")
        self._attr_device_class = description.device_class
        self._attr_entity_category = description.entity_category

    @property
    def is_on(self) -> bool | None:
        slot = self._slot
        if not slot:
            return None
        return self._description.value_fn(slot)

    @property
    def _slot(self) -> dict[str, Any] | None:
        for slot in ams_slots(self.ams):
            if slot.get("slot") == self._slot_index:
                return slot
        return None


def _bool_value(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    return None


def _print_option_enabled(printer: dict[str, Any], option_key: str) -> bool | None:
    print_options = printer.get("printOptions")
    if not isinstance(print_options, dict):
        return None
    option = print_options.get(option_key)
    if not isinstance(option, dict):
        return None
    return _bool_value(option.get("enabled"))


def _ams_setting_value(printer: dict[str, Any], setting_key: str) -> bool | None:
    ams_settings = printer.get("amsSettings")
    if not isinstance(ams_settings, dict):
        return None
    return _bool_value(ams_settings.get(setting_key))
