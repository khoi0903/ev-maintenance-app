// services/vehicleService.js
const vehicleRepo = require("../repositories/vehicleRepository");
const modelRepo = require("../repositories/modelRepository");

const parseNotes = (notes) => {
  if (!notes) return {};
  try {
    const obj = JSON.parse(notes);
    return typeof obj === 'object' && obj !== null ? obj : {};
  } catch {
    return {};
  }
};

const normalize = (row) => {
  const extra = parseNotes(row.Notes);
  const mileage = extra.mileage != null ? Number(extra.mileage) : null;
  const batterySoh = extra.batterySoh != null ? Number(extra.batterySoh) : null;

  const normalizedMileage = mileage !== null && !Number.isNaN(mileage) ? mileage : null;
  const normalizedBattery = batterySoh !== null && !Number.isNaN(batterySoh) ? batterySoh : null;

  return {
    id: row.VehicleID,
    VehicleID: row.VehicleID,
    accountId: row.AccountID,
    AccountID: row.AccountID,
    modelId: row.ModelID,
    ModelID: row.ModelID,
    vin: row.VIN,
    VIN: row.VIN,
    licensePlate: row.LicensePlate,
    LicensePlate: row.LicensePlate,
    year: row.Year,
    Year: row.Year,
    color: row.Color,
    Color: row.Color,
    notes: row.Notes,
    Notes: row.Notes,
    createdAt: row.CreatedAt,
    CreatedAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    UpdatedAt: row.UpdatedAt,
    brand: row.Brand,
    Brand: row.Brand,
    modelName: row.ModelName,
    ModelName: row.ModelName,
    ownerName: row.OwnerName || null,
    OwnerName: row.OwnerName || null,
    ownerPhone: row.OwnerPhone || null,
    OwnerPhone: row.OwnerPhone || null,
    ownerEmail: row.OwnerEmail || null,
    OwnerEmail: row.OwnerEmail || null,
    mileage: normalizedMileage,
    Mileage: normalizedMileage,
    batterySoh: normalizedBattery,
    batterySOH: normalizedBattery,
    BatterySOH: normalizedBattery,
  };
};

class VehicleService {
  async #resolveModelId(payload) {
    const rawModelId = payload.ModelID ?? payload.modelId;
    const numericId =
      rawModelId === undefined || rawModelId === null || rawModelId === ''
        ? null
        : Number(rawModelId);
    if (numericId !== null && !Number.isNaN(numericId)) {
      return numericId;
    }

    const brandName = String(payload.Brand ?? payload.brand ?? payload.brandName ?? '').trim();
    const modelName = String(payload.ModelName ?? payload.modelName ?? payload.model ?? '').trim();
    if (!brandName || !modelName) {
      throw new Error("Brand and Model name are required when ModelID is not provided.");
    }

    const existing = await modelRepo.findByBrandAndName(brandName, modelName);
    if (existing) return existing.ModelID;

    const created = await modelRepo.create({ brand: brandName, modelName });
    return created?.ModelID;
  }

  async list({ accountId } = {}) {
    const rows = await vehicleRepo.findAll({ accountId });
    return rows.map(normalize);
  }

  async getById(id) {
    const row = await vehicleRepo.findById(id);
    return row ? normalize(row) : null;
  }

  async create(payload) {
    const ModelID = await this.#resolveModelId(payload);
    if (!payload.LicensePlate && !payload.licensePlate) throw new Error("LicensePlate is required.");
    if (!payload.VIN && !payload.vin) throw new Error("VIN is required.");
    const rawYear = payload.Year ?? payload.year;
    const Year =
      rawYear === undefined || rawYear === null || rawYear === ''
        ? null
        : Number(rawYear);
    if (Year !== null && Number.isNaN(Year)) throw new Error("Year must be a number if provided.");

    const created = await vehicleRepo.create({
      AccountID: Number(payload.AccountID ?? payload.accountId),
      ModelID,
      VIN: String(payload.VIN ?? payload.vin).toUpperCase().trim(),
      LicensePlate: String(payload.LicensePlate ?? payload.licensePlate).toUpperCase().trim(),
      Year: Year,
      Color: payload.Color ?? payload.color ?? null,
      Notes: payload.Notes ?? payload.notes ?? null
    });
    return normalize(created);
  }

  async update(id, payload) {
    const ModelID = await this.#resolveModelId(payload);
    const rawYear = payload.Year ?? payload.year;
    const Year =
      rawYear === undefined || rawYear === null || rawYear === ''
        ? null
        : Number(rawYear);
    if (Year !== null && Number.isNaN(Year)) throw new Error("Year must be a number if provided.");

    const updated = await vehicleRepo.update(id, {
      ModelID,
      VIN: String(payload.VIN ?? payload.vin).toUpperCase().trim(),
      LicensePlate: String(payload.LicensePlate ?? payload.licensePlate).toUpperCase().trim(),
      Year: Year,
      Color: payload.Color ?? payload.color ?? null,
      Notes: payload.Notes ?? payload.notes ?? null
    });
    return updated ? normalize(updated) : null;
  }

  async remove(id) {
    return vehicleRepo.remove(id);
  }
}

module.exports = new VehicleService();
