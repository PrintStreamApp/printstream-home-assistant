"""Sensor entities for the PrintStream bridge."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode, urlsplit, urlunsplit

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, UnitOfTemperature, UnitOfTime
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import build_url
from .const import CONF_HUB_URL, DATA_COORDINATOR, DOMAIN
from .coordinator import PrintStreamBridgeCoordinator
from .entity import (
    PrintStreamAmsEntity,
    PrintStreamPrinterEntity,
    ams_unique_id,
    ams_slots,
    printer_unique_id,
    printer_external_spools,
    printer_has_light_node,
    printer_nozzles,
    printer_supports_airduct_mode,
    printer_supports_aux_fan,
    printer_supports_chamber_fan,
    printer_supports_chamber_temperature,
    printer_supports_door_sensor,
    printer_supports_dual_nozzles,
)


_GENERIC_FILAMENT_LABELS = {
    "ABS",
    "ABS-GF",
    "ASA",
    "ASA AERO",
    "ASA-CF",
    "PA",
    "PA6-CF",
    "PA6-GF",
    "PAHT-CF",
    "PC",
    "PC FR",
    "PC-FR",
    "PET-CF",
    "PETG",
    "PETG BASIC",
    "PETG HF",
    "PETG TRANSLUCENT",
    "PETG-CF",
    "PLA",
    "PLA AERO",
    "PLA BASIC",
    "PLA DYNAMIC",
    "PLA GALAXY",
    "PLA GLOW",
    "PLA LITE",
    "PLA MARBLE",
    "PLA MATTE",
    "PLA METAL",
    "PLA SILK",
    "PLA SILK+",
    "PLA SPARKLE",
    "PLA TOUGH",
    "PLA TOUGH+",
    "PLA WOOD",
    "PLA-CF",
    "PPA-CF",
    "PPS-CF",
    "PVA",
    "SUPPORT",
    "SUPPORT FOR ABS",
    "SUPPORT FOR PA/PET",
    "SUPPORT FOR PLA",
    "SUPPORT FOR PLA/PETG",
    "TPU",
    "TPU 85A",
    "TPU 90A",
    "TPU 95A",
    "TPU 95A HF",
    "TPU FOR AMS",
}

_KNOWN_HEX_COLOR_NAMES = {
    "#000000": "Black",
    "#FFFFFF": "White",
    "#A6A9AA": "Silver",
    "#D1D3D5": "Light Gray",
    "#8E9089": "Gray",
    "#545454": "Dark Gray",
    "#C12E1F": "Red",
    "#EC008C": "Magenta",
    "#F55A74": "Pink",
    "#FEC600": "Sunflower Yellow",
    "#FF6A13": "Orange",
    "#00AE42": "Bambu Green",
    "#00B1B7": "Turquoise",
    "#0086D6": "Cyan",
    "#0A2989": "Blue",
    "#0056B8": "Cobalt Blue",
    "#5E43B7": "Purple",
    "#9D432C": "Brown",
    "#F7D959": "Lemon Yellow",
    "#61C680": "Grass Green",
    "#56B7E6": "Sky Blue",
    "#0078BF": "Marine Blue",
    "#009FA1": "Teal",
    "#B8CDE9": "Ice Blue",
    "#D6ABFF": "Lavender",
    "#96DCB9": "Mint",
    "#F3CFB2": "Champagne",
    "#F5F5DC": "Natural",
}


def _always_true(_: dict[str, Any]) -> bool:
    return True


@dataclass(frozen=True, slots=True)
class PrinterSensorDescription:
    suffix: str
    name: str
    value_fn: Callable[[dict[str, Any]], int | float | str | None]
    predicate: Callable[[dict[str, Any]], bool] = _always_true
    device_class: SensorDeviceClass | None = None
    native_unit_of_measurement: str | None = None
    entity_category: EntityCategory | None = None
    entity_registry_enabled_default: bool = True


@dataclass(frozen=True, slots=True)
class AmsSensorDescription:
    suffix: str
    name: str
    value_fn: Callable[[dict[str, Any]], int | float | str | None]
    predicate: Callable[[dict[str, Any]], bool] = _always_true
    device_class: SensorDeviceClass | None = None
    native_unit_of_measurement: str | None = None
    entity_category: EntityCategory | None = None
    entity_registry_enabled_default: bool = True


@dataclass(frozen=True, slots=True)
class AmsSlotSensorDescription:
    suffix: str
    name: str
    value_fn: Callable[[dict[str, Any]], int | float | str | None]
    device_class: SensorDeviceClass | None = None
    native_unit_of_measurement: str | None = None
    entity_category: EntityCategory | None = None
    entity_registry_enabled_default: bool = True


_PRINTER_SENSOR_DESCRIPTIONS: tuple[PrinterSensorDescription, ...] = (
    PrinterSensorDescription("current_layer", "Current Layer", lambda printer: _number_value(printer.get("currentLayer"))),
    PrinterSensorDescription("total_layers", "Total Layers", lambda printer: _number_value(printer.get("totalLayers"))),
    PrinterSensorDescription(
        "remaining_time",
        "Remaining Time",
        lambda printer: _number_value(printer.get("remainingMinutes")),
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=SensorDeviceClass.DURATION,
    ),
    PrinterSensorDescription("sub_stage", "Sub Stage", lambda printer: _string_value(printer.get("subStage"))),
    PrinterSensorDescription("job_name", "Job Name", lambda printer: _string_value(printer.get("jobName"))),
    PrinterSensorDescription("last_job_name", "Last Job Name", lambda printer: _string_value(printer.get("lastJobName"))),
    PrinterSensorDescription("gcode_file", "Gcode File", lambda printer: _string_value(printer.get("gcodeFile"))),
    PrinterSensorDescription(
        "nozzle_target_temperature",
        "Nozzle Target Temperature",
        lambda printer: _number_value(printer.get("nozzleTarget")),
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
    ),
    PrinterSensorDescription(
        "bed_target_temperature",
        "Bed Target Temperature",
        lambda printer: _number_value(printer.get("bedTarget")),
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
    ),
    PrinterSensorDescription("fan_gear_speed", "Fan Gear Speed", lambda printer: _number_value(printer.get("fanGearSpeed"))),
    PrinterSensorDescription(
        "wifi_signal",
        "Wi-Fi Signal",
        lambda printer: _number_value(printer.get("wifiSignalDbm")),
        device_class=SensorDeviceClass.SIGNAL_STRENGTH,
        native_unit_of_measurement="dBm",
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PrinterSensorDescription(
        "ip_address",
        "IP Address",
        lambda printer: _string_value(printer.get("ipAddress")),
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PrinterSensorDescription(
        "duct_mode",
        "Duct Mode",
        lambda printer: _string_value(printer.get("ductMode")),
        predicate=printer_supports_airduct_mode,
    ),
    PrinterSensorDescription(
        "duct_available_modes",
        "Duct Available Modes",
        lambda printer: _duct_available_modes_value(printer),
        predicate=printer_supports_airduct_mode,
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PrinterSensorDescription(
        "firmware_version",
        "Firmware Version",
        lambda printer: _string_value(printer.get("firmwareVersion")),
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PrinterSensorDescription(
        "hms_error_count",
        "HMS Error Count",
        lambda printer: _count_items(printer.get("hmsErrors")),
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PrinterSensorDescription(
        "hms_error_codes",
        "HMS Error Codes",
        lambda printer: _hms_error_codes_value(printer),
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PrinterSensorDescription(
        "chamber_light_mode",
        "Chamber Light Mode",
        lambda printer: _light_mode_value(printer, "chamber"),
        predicate=lambda printer: printer_has_light_node(printer, "chamber"),
    ),
    PrinterSensorDescription(
        "heatbed_light_mode",
        "Heatbed Light Mode",
        lambda printer: _light_mode_value(printer, "heatbed"),
        predicate=lambda printer: printer_has_light_node(printer, "heatbed"),
    ),
    PrinterSensorDescription(
        "work_light_mode",
        "Work Light Mode",
        lambda printer: _light_mode_value(printer, "work"),
        predicate=lambda printer: printer_has_light_node(printer, "work"),
    ),
)


_AMS_SENSOR_DESCRIPTIONS: tuple[AmsSensorDescription, ...] = (
    AmsSensorDescription(
        "dry_time_remaining",
        "Dry Time Remaining",
        lambda ams: _number_value(ams.get("dryTimeRemainingMinutes")),
        predicate=lambda ams: bool(ams.get("supportDrying")),
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=SensorDeviceClass.DURATION,
    ),
    AmsSensorDescription(
        "dry_filament",
        "Dry Filament",
        lambda ams: _string_value(ams.get("dryFilament")),
        predicate=lambda ams: bool(ams.get("supportDrying")),
    ),
    AmsSensorDescription(
        "dry_temperature",
        "Dry Temperature",
        lambda ams: _number_value(ams.get("dryTemperature")),
        predicate=lambda ams: bool(ams.get("supportDrying")),
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
    ),
    AmsSensorDescription(
        "dry_duration",
        "Dry Duration",
        lambda ams: _number_value(ams.get("dryDurationHours")),
        predicate=lambda ams: bool(ams.get("supportDrying")),
        native_unit_of_measurement=UnitOfTime.HOURS,
        device_class=SensorDeviceClass.DURATION,
    ),
    AmsSensorDescription(
        "humidity_level",
        "Humidity Level",
        lambda ams: _number_value(ams.get("humidityLevel")),
        predicate=lambda ams: ams.get("humidityLevel") is not None,
    ),
    AmsSensorDescription(
        "nozzle_id",
        "Nozzle ID",
        lambda ams: _number_value(ams.get("nozzleId")),
        predicate=lambda ams: ams.get("nozzleId") is not None,
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
)


_AMS_SLOT_SENSOR_DESCRIPTIONS: tuple[AmsSlotSensorDescription, ...] = (
    AmsSlotSensorDescription("remain_percent", "Remain", lambda slot: _number_value(slot.get("remainPercent")), native_unit_of_measurement=PERCENTAGE),
    AmsSlotSensorDescription("raw_tray_code", "Raw Tray Code", lambda slot: _resolve_ams_slot_display(slot)["raw_tray_code"], entity_category=EntityCategory.DIAGNOSTIC),
    AmsSlotSensorDescription("color_hex", "Color Hex", lambda slot: _resolve_ams_slot_display(slot)["color_hex"]),
    AmsSlotSensorDescription("tray_info_idx", "Tray Info Index", lambda slot: _string_value(slot.get("trayInfoIdx")), entity_category=EntityCategory.DIAGNOSTIC),
    AmsSlotSensorDescription("k_value", "K Value", lambda slot: _number_value(slot.get("k"))),
    AmsSlotSensorDescription("tray_uuid", "Tray UUID", lambda slot: _string_value(slot.get("trayUuid")), entity_category=EntityCategory.DIAGNOSTIC),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensor entities from a config entry."""
    coordinator: PrintStreamBridgeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    known_entities: set[str] = set()

    @callback
    def _async_sync_entities() -> None:
        new_entities: list[SensorEntity] = []

        for printer in coordinator.data.printers:
            printer_id = _string_value(printer.get("id"))
            if not printer_id:
                continue

            for suffix, predicate, entity in (
                ("status", _always_true, PrintStreamPrinterStatusSensor(coordinator, entry, printer_id)),
                ("progress", _always_true, PrintStreamPrinterProgressSensor(coordinator, entry, printer_id)),
                ("nozzle_temperature", _always_true, PrintStreamPrinterTemperatureSensor(coordinator, entry, printer_id, "Nozzle Temperature", "nozzleTemp")),
                ("bed_temperature", _always_true, PrintStreamPrinterTemperatureSensor(coordinator, entry, printer_id, "Bed Temperature", "bedTemp")),
                ("chamber_temperature", printer_supports_chamber_temperature, PrintStreamPrinterTemperatureSensor(coordinator, entry, printer_id, "Chamber Temperature", "chamberTemp")),
                ("part_fan", _always_true, PrintStreamPrinterPercentSensor(coordinator, entry, printer_id, "Part Fan", "partFanPercent")),
                ("aux_fan", printer_supports_aux_fan, PrintStreamPrinterPercentSensor(coordinator, entry, printer_id, "Aux Fan", "auxFanPercent")),
                ("chamber_fan", printer_supports_chamber_fan, PrintStreamPrinterPercentSensor(coordinator, entry, printer_id, "Chamber Fan", "chamberFanPercent")),
                ("speed_level", _always_true, PrintStreamPrinterValueSensor(coordinator, entry, printer_id, "Speed Level", "speedLevel")),
            ):
                if not predicate(printer):
                    continue
                key = f"printer:{printer_id}:{suffix}"
                if key in known_entities:
                    continue
                known_entities.add(key)
                new_entities.append(entity)

            for description in _PRINTER_SENSOR_DESCRIPTIONS:
                if not description.predicate(printer):
                    continue
                key = f"printer:{printer_id}:{description.suffix}"
                if key in known_entities:
                    continue
                known_entities.add(key)
                new_entities.append(PrintStreamPrinterMappedSensor(coordinator, entry, printer_id, description))

            if printer_supports_dual_nozzles(printer):
                for nozzle in printer_nozzles(printer):
                    extruder_id = nozzle.get("extruderId")
                    if not isinstance(extruder_id, int):
                        continue
                    for suffix, name, target_field in (
                        (f"nozzle_{extruder_id + 1}_temperature", f"Nozzle {extruder_id + 1} Temperature", "currentTemp"),
                        (f"nozzle_{extruder_id + 1}_target_temperature", f"Nozzle {extruder_id + 1} Target Temperature", "targetTemp"),
                    ):
                        key = f"printer:{printer_id}:{suffix}"
                        if key in known_entities:
                            continue
                        known_entities.add(key)
                        new_entities.append(
                            PrintStreamPrinterNozzleTemperatureSensor(
                                coordinator,
                                entry,
                                printer_id,
                                extruder_id,
                                name,
                                target_field,
                            )
                        )

            for spool in printer_external_spools(printer):
                spool_id = _external_spool_id(spool)
                if spool_id is None:
                    continue
                key = f"printer:{printer_id}:external_spool:{spool_id}"
                if key in known_entities:
                    continue
                known_entities.add(key)
                new_entities.append(PrintStreamPrinterExternalSpoolSensor(coordinator, entry, printer_id, spool_id))

            for ams in printer.get("ams", []):
                if not isinstance(ams, dict):
                    continue
                ams_id = _string_value(ams.get("id"))
                if not ams_id:
                    continue
                for suffix, predicate, entity in (
                    ("status", _always_true, PrintStreamAmsStatusSensor(coordinator, entry, ams_id)),
                    ("temperature", _always_true, PrintStreamAmsTemperatureSensor(coordinator, entry, ams_id)),
                    ("humidity", lambda unit: unit.get("humidityPercent") is not None, PrintStreamAmsHumiditySensor(coordinator, entry, ams_id)),
                    ("active_slot", _always_true, PrintStreamAmsActiveSlotSensor(coordinator, entry, ams_id)),
                ):
                    if not predicate(ams):
                        continue
                    key = f"ams:{ams_id}:{suffix}"
                    if key in known_entities:
                        continue
                    known_entities.add(key)
                    new_entities.append(entity)

                for description in _AMS_SENSOR_DESCRIPTIONS:
                    if not description.predicate(ams):
                        continue
                    key = f"ams:{ams_id}:{description.suffix}"
                    if key in known_entities:
                        continue
                    known_entities.add(key)
                    new_entities.append(PrintStreamAmsMappedSensor(coordinator, entry, ams_id, description))

                for slot in ams_slots(ams):
                    if not isinstance(slot, dict):
                        continue
                    slot_index = slot.get("slot")
                    if not isinstance(slot_index, int):
                        continue
                    key = f"ams:{ams_id}:slot:{slot_index}"
                    if key in known_entities:
                        continue
                    known_entities.add(key)
                    new_entities.append(PrintStreamAmsSlotSensor(coordinator, entry, ams_id, slot_index))

                    for description in _AMS_SLOT_SENSOR_DESCRIPTIONS:
                        slot_key = f"ams:{ams_id}:slot:{slot_index}:{description.suffix}"
                        if slot_key in known_entities:
                            continue
                        known_entities.add(slot_key)
                        new_entities.append(PrintStreamAmsSlotMappedSensor(coordinator, entry, ams_id, slot_index, description))

        if new_entities:
            async_add_entities(new_entities)

    _async_sync_entities()
    entry.async_on_unload(coordinator.async_add_listener(_async_sync_entities))


class PrintStreamPrinterStatusSensor(PrintStreamPrinterEntity, SensorEntity):
    """Primary status sensor for a printer."""

    _attr_name = "Status"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, "status")

    @property
    def native_value(self) -> str | None:
        printer = self.printer
        if not printer:
            return None
        if printer.get("online") is False:
            return "offline"
        return _string_value(printer.get("stage")) or "unknown"

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        printer = self.printer
        if not printer:
            return None

        return {
            "printstream_kind": "printer",
            "printer_id": printer.get("id"),
            "printer_serial": printer.get("serial"),
            "printer_name": printer.get("name"),
            "printer_model": printer.get("model"),
            "camera_supported": printer.get("cameraSupported"),
            "supports_camera": bool(printer.get("cameraSupported")),
            "online": printer.get("online"),
            "sub_stage": printer.get("subStage"),
            "progress_percent": printer.get("progressPercent"),
            "current_layer": printer.get("currentLayer"),
            "total_layers": printer.get("totalLayers"),
            "remaining_minutes": printer.get("remainingMinutes"),
            "job_name": printer.get("jobName"),
            "last_job_name": printer.get("lastJobName"),
            "gcode_file": printer.get("gcodeFile"),
            "nozzle_temp": printer.get("nozzleTemp"),
            "nozzle_target": printer.get("nozzleTarget"),
            "nozzles": printer.get("nozzles"),
            "bed_temp": printer.get("bedTemp"),
            "bed_target": printer.get("bedTarget"),
            "chamber_temp": printer.get("chamberTemp"),
            "fan_gear_speed": printer.get("fanGearSpeed"),
            "part_fan_percent": printer.get("partFanPercent"),
            "aux_fan_percent": printer.get("auxFanPercent"),
            "chamber_fan_percent": printer.get("chamberFanPercent"),
            "speed_level": printer.get("speedLevel"),
            "wifi_signal_dbm": printer.get("wifiSignalDbm"),
            "ip_address": printer.get("ipAddress"),
            "supports_door_sensor": printer_supports_door_sensor(printer),
            "door_open": printer.get("doorOpen"),
            "supports_airduct_mode": printer_supports_airduct_mode(printer),
            "duct_mode": printer.get("ductMode"),
            "duct_available_modes": printer.get("ductAvailableModes"),
            "supports_chamber_temperature": printer_supports_chamber_temperature(printer),
            "light_modes": printer.get("lightModes"),
            "light_capabilities": printer.get("lightCapabilities"),
            "light_on": printer.get("lightOn"),
            "print_options": printer.get("printOptions"),
            "ams_settings": printer.get("amsSettings"),
            "sd_card_present": printer.get("sdCardPresent"),
            "firmware_version": printer.get("firmwareVersion"),
            "hms_errors": printer.get("hmsErrors"),
            "ams_units": [_serialize_ams_unit(ams) for ams in printer.get("ams", []) if isinstance(ams, dict)],
            "external_spools": [_serialize_external_spool(spool) for spool in printer.get("externalSpools", []) if isinstance(spool, dict)],
            "observed_at": printer.get("observedAt"),
            "camera_snapshot_url": _bridge_url(self._entry, printer.get("cameraSnapshotPath"), printer),
            "cover_image_url": _cover_image_url(self._entry, printer),
            "detail_url": _detail_url(self._entry, printer),
        }


class PrintStreamPrinterProgressSensor(PrintStreamPrinterEntity, SensorEntity):
    """Print progress sensor."""

    _attr_name = "Progress"
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, "progress")

    @property
    def native_value(self) -> int | float | None:
        return _number_value((self.printer or {}).get("progressPercent"))


class PrintStreamPrinterTemperatureSensor(PrintStreamPrinterEntity, SensorEntity):
    """Temperature sensor for a printer."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        printer_id: str,
        name: str,
        field: str,
    ) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_name = name
        self._field = field
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, field.lower())

    @property
    def native_value(self) -> int | float | None:
        return _number_value((self.printer or {}).get(self._field))


class PrintStreamPrinterPercentSensor(PrintStreamPrinterEntity, SensorEntity):
    """Percentage sensor for a printer."""

    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        printer_id: str,
        name: str,
        field: str,
    ) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_name = name
        self._field = field
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, field.lower())

    @property
    def native_value(self) -> int | float | None:
        return _number_value((self.printer or {}).get(self._field))


class PrintStreamPrinterValueSensor(PrintStreamPrinterEntity, SensorEntity):
    """Generic numeric/status value sensor for a printer."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        printer_id: str,
        name: str,
        field: str,
    ) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._attr_name = name
        self._field = field
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, field.lower())

    @property
    def native_value(self) -> int | float | str | None:
        value = (self.printer or {}).get(self._field)
        if isinstance(value, (int, float, str)):
            return value
        return None


class PrintStreamPrinterMappedSensor(PrintStreamPrinterEntity, SensorEntity):
    """Generic printer sensor backed by a value description."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        printer_id: str,
        description: PrinterSensorDescription,
    ) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._description = description
        self._attr_name = description.name
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, description.suffix)
        self._attr_device_class = description.device_class
        self._attr_native_unit_of_measurement = description.native_unit_of_measurement
        self._attr_entity_category = description.entity_category

    @property
    def native_value(self) -> int | float | str | None:
        printer = self.printer
        if not printer:
            return None
        return self._description.value_fn(printer)


class PrintStreamPrinterNozzleTemperatureSensor(PrintStreamPrinterEntity, SensorEntity):
    """Per-nozzle temperature sensor for dual-nozzle printers."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        printer_id: str,
        extruder_id: int,
        name: str,
        field: str,
    ) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._extruder_id = extruder_id
        self._field = field
        self._attr_name = name
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, f"nozzle_{extruder_id + 1}_{field.lower()}")

    @property
    def native_value(self) -> int | float | None:
        nozzle = self._nozzle
        if not nozzle:
            return None
        return _number_value(nozzle.get(self._field))

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        nozzle = self._nozzle
        if not nozzle:
            return None
        return {
            "extruder_id": nozzle.get("extruderId"),
            "diameter": nozzle.get("diameter"),
            "type_code": nozzle.get("typeCode"),
            "material": nozzle.get("material"),
            "flow": nozzle.get("flow"),
        }

    @property
    def _nozzle(self) -> dict[str, Any] | None:
        for nozzle in printer_nozzles(self.printer):
            if nozzle.get("extruderId") == self._extruder_id:
                return nozzle
        return None


class PrintStreamPrinterExternalSpoolSensor(PrintStreamPrinterEntity, SensorEntity):
    """Summary sensor for a printer's manual spool holder."""

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, printer_id: str, spool_id: int) -> None:
        super().__init__(coordinator, entry, printer_id)
        self._spool_id = spool_id
        self._attr_unique_id = printer_unique_id(entry, self.printer, printer_id, f"external_spool_{spool_id}")

    @property
    def name(self) -> str:
        return _external_spool_name(self._spool_id, len(printer_external_spools(self.printer)))

    @property
    def native_value(self) -> str | None:
        spool = self._spool
        if not spool:
            return None
        display = _resolve_ams_slot_display(spool)
        if display["display_name"]:
            return display["display_name"]
        if display["filament_type"]:
            return display["filament_type"]
        return "Empty"

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        spool = self._spool
        if not spool:
            return None
        display = _resolve_ams_slot_display(spool)
        return {
            "ams_id": spool.get("amsId"),
            "nozzle_id": spool.get("nozzleId"),
            "active": spool.get("active"),
            "display_name": display["display_name"],
            "color_name": display["color_name"],
            "raw_tray_code": display["raw_tray_code"],
            "color_hex": display["color_hex"],
            "tray_name": spool.get("trayName"),
            "filament_type": spool.get("filamentType"),
            "color": spool.get("color"),
            "colors": spool.get("colors"),
            "remain_percent": spool.get("remainPercent"),
            "tray_info_idx": spool.get("trayInfoIdx"),
            "k_value": spool.get("k"),
            "tray_uuid": spool.get("trayUuid"),
            "detail_url": _detail_url(self._entry, self.printer or {}),
        }

    @property
    def _spool(self) -> dict[str, Any] | None:
        for spool in printer_external_spools(self.printer):
            if _external_spool_id(spool) == self._spool_id:
                return spool
        return None


class PrintStreamAmsStatusSensor(PrintStreamAmsEntity, SensorEntity):
    """Primary status sensor for an AMS unit."""

    _attr_name = "Status"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, "status")

    @property
    def native_value(self) -> str | None:
        ams = self.ams
        if not ams:
            return None
        if ams.get("dryingActive"):
            return "drying"
        if ams.get("activeSlot") is not None:
            return "ready"
        return "idle"

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        ams = self.ams
        if not ams:
            return None

        return {
            "printstream_kind": "ams",
            "ams_id": ams.get("id"),
            "unit_id": ams.get("unitId"),
            "name": ams.get("name"),
            "nozzle_id": ams.get("nozzleId"),
            "printer_id": ams.get("printerId"),
            "printer_name": ams.get("printerName"),
            "printer_serial": ams.get("printerSerial"),
            "support_drying": ams.get("supportDrying"),
            "drying_active": ams.get("dryingActive"),
            "dry_time_remaining_minutes": ams.get("dryTimeRemainingMinutes"),
            "dry_filament": ams.get("dryFilament"),
            "dry_temperature": ams.get("dryTemperature"),
            "dry_duration_hours": ams.get("dryDurationHours"),
            "humidity_percent": ams.get("humidityPercent"),
            "humidity_level": ams.get("humidityLevel"),
            "temperature": ams.get("temperature"),
            "active_slot": _active_slot_value(ams),
            "slots": ams.get("slots"),
            "slots_display": [_serialize_ams_slot(slot) for slot in ams.get("slots", []) if isinstance(slot, dict)],
            "detail_url": _detail_url(self._entry, {"detailPath": f"/printers/{ams.get('printerId')}"}),
        }


class PrintStreamAmsTemperatureSensor(PrintStreamAmsEntity, SensorEntity):
    """Temperature sensor for an AMS unit."""

    _attr_name = "Temperature"
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, "temperature")

    @property
    def native_value(self) -> int | float | None:
        return _number_value((self.ams or {}).get("temperature"))


class PrintStreamAmsHumiditySensor(PrintStreamAmsEntity, SensorEntity):
    """Humidity percentage sensor for an AMS unit when available."""

    _attr_name = "Humidity"
    _attr_device_class = SensorDeviceClass.HUMIDITY
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, "humidity")

    @property
    def native_value(self) -> int | float | None:
        return _number_value((self.ams or {}).get("humidityPercent"))


class PrintStreamAmsMappedSensor(PrintStreamAmsEntity, SensorEntity):
    """Generic AMS sensor backed by a value description."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        ams_id: str,
        description: AmsSensorDescription,
    ) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._description = description
        self._attr_name = description.name
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, description.suffix)
        self._attr_device_class = description.device_class
        self._attr_native_unit_of_measurement = description.native_unit_of_measurement
        self._attr_entity_category = description.entity_category

    @property
    def native_value(self) -> int | float | str | None:
        ams = self.ams
        if not ams:
            return None
        return self._description.value_fn(ams)


class PrintStreamAmsActiveSlotSensor(PrintStreamAmsEntity, SensorEntity):
    """1-based active slot sensor for an AMS unit."""

    _attr_name = "Active Slot"

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, "active_slot")

    @property
    def native_value(self) -> int | None:
        return _active_slot_value(self.ams)


class PrintStreamAmsSlotSensor(PrintStreamAmsEntity, SensorEntity):
    """Tray entity for a single AMS slot."""

    def __init__(self, coordinator: PrintStreamBridgeCoordinator, entry: ConfigEntry, ams_id: str, slot_index: int) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._slot_index = slot_index
        self._attr_name = f"Tray {slot_index + 1}"
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, f"tray_{slot_index + 1}")

    @property
    def native_value(self) -> str | None:
        slot = self._slot
        if not slot:
            return None
        display = _resolve_ams_slot_display(slot)
        if display["display_name"]:
            return display["display_name"]
        if display["filament_type"]:
            return display["filament_type"]
        return "Empty"

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        slot = self._slot
        ams = self.ams
        if not slot or not ams:
            return None
        display = _resolve_ams_slot_display(slot)
        return {
            "printstream_kind": "ams_slot",
            "ams_id": ams.get("id"),
            "ams_unit_id": ams.get("unitId"),
            "printer_id": ams.get("printerId"),
            "printer_name": ams.get("printerName"),
            "slot": self._slot_index + 1,
            "active": slot.get("active"),
            "is_reading": slot.get("isReading"),
            "display_name": display["display_name"],
            "color_name": display["color_name"],
            "raw_tray_code": display["raw_tray_code"],
            "color_hex": display["color_hex"],
            "tray_name": slot.get("trayName"),
            "filament_type": slot.get("filamentType"),
            "color": slot.get("color"),
            "colors": slot.get("colors"),
            "remain_percent": slot.get("remainPercent"),
            "tray_info_idx": slot.get("trayInfoIdx"),
            "k_value": slot.get("k"),
            "tray_uuid": slot.get("trayUuid"),
            "empty": not _slot_has_filament(slot),
            "detail_url": _detail_url(self._entry, {"detailPath": f"/printers/{ams.get('printerId')}"}),
        }

    @property
    def _slot(self) -> dict[str, Any] | None:
        ams = self.ams
        if not ams:
            return None
        slots = ams.get("slots", [])
        if not isinstance(slots, list):
            return None
        for slot in slots:
            if isinstance(slot, dict) and slot.get("slot") == self._slot_index:
                return slot
        return None


class PrintStreamAmsSlotMappedSensor(PrintStreamAmsEntity, SensorEntity):
    """Generic slot sensor for AMS slot details."""

    def __init__(
        self,
        coordinator: PrintStreamBridgeCoordinator,
        entry: ConfigEntry,
        ams_id: str,
        slot_index: int,
        description: AmsSlotSensorDescription,
    ) -> None:
        super().__init__(coordinator, entry, ams_id)
        self._slot_index = slot_index
        self._description = description
        self._attr_name = f"Tray {slot_index + 1} {description.name}"
        self._attr_unique_id = ams_unique_id(entry, self.ams, ams_id, f"tray_{slot_index + 1}_{description.suffix}")
        self._attr_device_class = description.device_class
        self._attr_native_unit_of_measurement = description.native_unit_of_measurement
        self._attr_entity_category = description.entity_category

    @property
    def native_value(self) -> int | float | str | None:
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


def _detail_url(entry: ConfigEntry, printer: dict[str, Any]) -> str | None:
    detail_path = _string_value(printer.get("detailPath"))
    if not detail_path:
        return None
    return build_url(entry.data[CONF_HUB_URL], detail_path)


def _bridge_url(entry: ConfigEntry, path: Any, printer: dict[str, Any] | None = None) -> str | None:
    path_value = _string_value(path)
    if not path_value:
        return None
    return _append_cache_buster(build_url(entry.data[CONF_HUB_URL], path_value), printer)


def _cover_image_url(entry: ConfigEntry, printer: dict[str, Any]) -> str | None:
    direct_url = _bridge_url(entry, printer.get("coverImagePath"), printer)
    if direct_url:
        return direct_url

    printer_id = _string_value(printer.get("id"))
    cover_job_name = _string_value(printer.get("jobName")) or _string_value(printer.get("lastJobName"))
    if not printer_id or not cover_job_name:
        return None

    query = urlencode({
        "job": cover_job_name,
        "gcode": _string_value(printer.get("gcodeFile")) or "",
    })
    return _append_cache_buster(build_url(entry.data[CONF_HUB_URL], f"/api/printers/{printer_id}/cover?{query}"), printer)


def _append_cache_buster(url: str, printer: dict[str, Any] | None) -> str:
    observed_at = (printer or {}).get("observedAt")
    if not isinstance(observed_at, str) or not observed_at:
        return url

    parts = urlsplit(url)
    separator = "&" if parts.query else "?"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, f"{parts.query}{separator if parts.query else ''}t={observed_at}", parts.fragment))


def _active_slot_value(ams: dict[str, Any] | None) -> int | None:
    if not ams:
        return None
    active_slot = ams.get("activeSlot")
    if isinstance(active_slot, int):
        return active_slot + 1
    return None


def _number_value(value: Any) -> int | float | None:
    if isinstance(value, (int, float)):
        return value
    return None


def _count_items(value: Any) -> int:
    return len(value) if isinstance(value, list) else 0


def _string_value(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _serialize_ams_slot(slot: dict[str, Any]) -> dict[str, Any]:
    display = _resolve_ams_slot_display(slot)
    return {
        **slot,
        "displayName": display["display_name"],
        "colorName": display["color_name"],
        "rawTrayCode": display["raw_tray_code"],
        "colorHex": display["color_hex"],
    }


def _serialize_ams_unit(ams: dict[str, Any]) -> dict[str, Any]:
    return {
        **ams,
        "slots": [_serialize_ams_slot(slot) for slot in ams.get("slots", []) if isinstance(slot, dict)],
    }


def _serialize_external_spool(spool: dict[str, Any]) -> dict[str, Any]:
    display = _resolve_ams_slot_display({
        "trayName": spool.get("trayName"),
        "filamentType": spool.get("filamentType"),
        "color": spool.get("color"),
        "colors": spool.get("colors"),
    })
    return {
        **spool,
        "displayName": display["display_name"],
        "colorName": display["color_name"],
        "rawTrayCode": display["raw_tray_code"],
        "colorHex": display["color_hex"],
    }


def _light_mode_value(printer: dict[str, Any], node: str) -> str | None:
    light_modes = printer.get("lightModes")
    if not isinstance(light_modes, dict):
        return None
    return _string_value(light_modes.get(node))


def _duct_available_modes_value(printer: dict[str, Any]) -> str | None:
    modes = printer.get("ductAvailableModes")
    if not isinstance(modes, list):
        return None
    normalized = [mode for mode in (_string_value(entry) for entry in modes) if mode]
    return ", ".join(normalized) if normalized else None


def _hms_error_codes_value(printer: dict[str, Any]) -> str | None:
    errors = printer.get("hmsErrors")
    if not isinstance(errors, list):
        return None
    labels: list[str] = []
    for error in errors:
        if not isinstance(error, dict):
            continue
        code = _string_value(error.get("code"))
        message = _string_value(error.get("message"))
        if code and message:
            labels.append(f"{code}: {message}")
        elif code:
            labels.append(code)
    return "; ".join(labels) if labels else None


def _external_spool_id(spool: dict[str, Any]) -> int | None:
    ams_id = spool.get("amsId")
    return ams_id if isinstance(ams_id, int) else None


def _external_spool_name(spool_id: int, spool_count: int) -> str:
    if spool_count > 1 and spool_id == 254:
        return "External Spool 2"
    return "External Spool"


def _resolve_ams_slot_display(slot: dict[str, Any]) -> dict[str, str | None]:
    tray_name = _string_value(slot.get("trayName"))
    filament_type = _normalize_filament_type(slot.get("filamentType"))
    raw_tray_code = _raw_tray_code(tray_name)
    color_hex = _primary_color_hex(slot)
    color_name = _color_name_for_hex(color_hex)

    if tray_name and raw_tray_code is None and not _should_suppress_repeated_tray_label(tray_name, filament_type):
        display_name = tray_name
    elif color_name:
        display_name = color_name
    elif filament_type:
        display_name = filament_type
    else:
        display_name = None

    return {
        "display_name": display_name,
        "color_name": color_name,
        "raw_tray_code": raw_tray_code,
        "color_hex": color_hex,
        "filament_type": filament_type,
    }


def _normalize_filament_type(value: Any) -> str | None:
    filament_type = _string_value(value)
    if not filament_type or filament_type == "0":
        return None
    return filament_type


def _raw_tray_code(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().upper()
    return normalized if _looks_like_raw_tray_code(normalized) else None


def _looks_like_raw_tray_code(value: str) -> bool:
    if len(value) < 6 or value[0].isalpha() is False or value[1:3].isdigit() is False or value[3] != "-":
        return False
    suffix = value[4:]
    return len(suffix) >= 2 and suffix[0].isalpha() and suffix[1:].isdigit()


def _should_suppress_repeated_tray_label(tray_name: str, filament_type: str | None) -> bool:
    if not filament_type:
        return False
    if tray_name.strip().casefold() != filament_type.strip().casefold():
        return False
    return filament_type.strip().upper() in _GENERIC_FILAMENT_LABELS


def _primary_color_hex(slot: dict[str, Any]) -> str | None:
    colors = slot.get("colors")
    if isinstance(colors, list):
        for entry in colors:
            normalized = _normalize_hex_color(entry)
            if normalized:
                return normalized
    return _normalize_hex_color(slot.get("color"))


def _normalize_hex_color(value: Any) -> str | None:
    text = _string_value(value)
    if not text:
        return None
    upper = text.upper()
    hex_value = upper[1:] if upper.startswith("#") else upper
    if len(hex_value) not in {6, 8}:
        return None
    if any(character not in "0123456789ABCDEF" for character in hex_value):
        return None
    return f"#{hex_value[:6]}"


def _color_name_for_hex(hex_value: str | None) -> str | None:
    if not hex_value:
        return None
    known = _KNOWN_HEX_COLOR_NAMES.get(hex_value)
    if known:
        return known

    red = int(hex_value[1:3], 16)
    green = int(hex_value[3:5], 16)
    blue = int(hex_value[5:7], 16)
    highest = max(red, green, blue)
    lowest = min(red, green, blue)
    delta = highest - lowest

    if highest <= 32:
        return "Black"
    if lowest >= 235:
        return "White"
    if delta <= 18:
        return "Silver" if highest >= 190 else "Gray"

    hue = _rgb_hue(red, green, blue)
    if hue < 15 or hue >= 345:
        return "Red"
    if hue < 40:
        return "Orange"
    if hue < 70:
        return "Yellow"
    if hue < 160:
        return "Green"
    if hue < 200:
        return "Cyan"
    if hue < 255:
        return "Blue"
    if hue < 290:
        return "Purple"
    if hue < 330:
        return "Magenta"
    return "Pink"


def _rgb_hue(red: int, green: int, blue: int) -> float:
    red_f = red / 255
    green_f = green / 255
    blue_f = blue / 255
    highest = max(red_f, green_f, blue_f)
    lowest = min(red_f, green_f, blue_f)
    delta = highest - lowest
    if delta == 0:
        return 0.0
    if highest == red_f:
        return (60 * ((green_f - blue_f) / delta) + 360) % 360
    if highest == green_f:
        return (60 * ((blue_f - red_f) / delta) + 120) % 360
    return (60 * ((red_f - green_f) / delta) + 240) % 360


def _slot_has_filament(slot: dict[str, Any]) -> bool:
    filament_type = _string_value(slot.get("filamentType"))
    colors = slot.get("colors") if isinstance(slot.get("colors"), list) else []
    color = _string_value(slot.get("color"))
    return bool((filament_type and filament_type != "0") or color or colors)
