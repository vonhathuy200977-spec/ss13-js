const OVERWEIGHT_RATE_FIRST_5_KG = 60000;
const OVERWEIGHT_RATE_AFTER_5_KG = 80000;
const OVERSIZE_FEE = 200000;
const PET_FEE = 500000;
const MEMBER_BONUS_KG = 10;

const BAGGAGE_TYPES = {
  standard: { label: "Hành lý thường", fee: 0 },
  musical_instrument: { label: "Nhạc cụ cồng kềnh", fee: OVERSIZE_FEE },
  golf_clubs: { label: "Gậy golf cồng kềnh", fee: OVERSIZE_FEE },
  pet_cabin: { label: "Thú cưng (cabin)", fee: PET_FEE },
  pet_hold: { label: "Thú cưng (khoang hàng)", fee: PET_FEE },
};

const MEMBER_TIER_RANK = {
  silver: 1,
  titan: 2,
  gold: 3,
  platinum: 4,
  million_miler: 5,
};

function requireNonNegativeNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${fieldName} phải là số hữu hạn và không âm.`);
  }
  return value;
}

function normalizeTier(tier) {
  if (tier == null || tier === "") return null;
  if (typeof tier !== "string") {
    throw new TypeError("ticket.memberTier phải là chuỗi.");
  }

  return tier.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatMoney(amount) {
  return `${Math.round(amount).toLocaleString("vi-VN")} VND`;
}

function formatWeight(weight) {
  return `${Number(weight.toFixed(2)).toLocaleString("vi-VN")} kg`;
}

function formatReceipt(ticket, baggageItems, result) {
  const nameWidth = 29;
  const typeWidth = 25;
  const weightWidth = 12;
  const feeWidth = 17;
  const separator = "-".repeat(nameWidth + typeWidth + weightWidth + feeWidth + 3);

  const rows = baggageItems.map(({ name, type, weightKg, serviceFee }) =>
    `${name.slice(0, nameWidth).padEnd(nameWidth)} ` +
    `${BAGGAGE_TYPES[type].label.slice(0, typeWidth).padEnd(typeWidth)} ` +
    `${formatWeight(weightKg).padStart(weightWidth)} ` +
    `${formatMoney(serviceFee).padStart(feeWidth)}`
  );

  return `BIÊN LAI THU PHỤ CƯỚC HÀNH LÝ
Hành khách: ${ticket.passengerName || "Khách hàng"}
Mã vé     : ${ticket.ticketNumber || "N/A"}
${separator}
${"Kiện hành lý".padEnd(nameWidth)} ${"Loại dịch vụ".padEnd(typeWidth)} ${"Trọng lượng".padStart(weightWidth)} ${"Phí dịch vụ".padStart(feeWidth)}
${separator}
${rows.length ? rows.join("\n") : "(Không có kiện hành lý)"}
${separator}
Tổng trọng lượng       : ${formatWeight(result.totalWeightKg)}
Hạn mức cơ bản         : ${formatWeight(result.baseAllowanceKg)}
Ưu đãi hội viên        : ${formatWeight(result.memberBonusKg)}
Hạn mức miễn cước      : ${formatWeight(result.totalAllowanceKg)}
Trọng lượng vượt cước  : ${formatWeight(result.overweightKg)}
Phí quá cước           : ${formatMoney(result.overweightFee)}
Phí dịch vụ đặc biệt   : ${formatMoney(result.specialServiceFee)}
TỔNG THANH TOÁN        : ${formatMoney(result.totalSurcharge)}
${separator}`;
}

function calculateBaggageSurcharge(ticket, baggageList) {
  if (!ticket || typeof ticket !== "object" || Array.isArray(ticket)) {
    throw new TypeError("ticket phải là một object hợp lệ.");
  }
  const baseAllowanceKg = requireNonNegativeNumber(
    ticket.freeBaggageKg,
    "ticket.freeBaggageKg"
  );
  if (!Array.isArray(baggageList)) {
    throw new TypeError("baggageList phải là một mảng.");
  }

  const tier = normalizeTier(ticket.memberTier);
  if (tier !== null && !Object.prototype.hasOwnProperty.call(MEMBER_TIER_RANK, tier)) {
    throw new RangeError(`Hạng hội viên không hợp lệ: ${ticket.memberTier}`);
  }
  const memberBonusKg =
    tier !== null && MEMBER_TIER_RANK[tier] >= MEMBER_TIER_RANK.titan
      ? MEMBER_BONUS_KG
      : 0;

  let totalWeightKg = 0;
  let specialServiceFee = 0;
  const baggageItems = baggageList.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new TypeError(`baggageList[${index}] phải là một object hợp lệ.`);
    }
    if (typeof item.name !== "string" || item.name.trim() === "") {
      throw new TypeError(`baggageList[${index}].name không được để trống.`);
    }
    if (!Object.prototype.hasOwnProperty.call(BAGGAGE_TYPES, item.type)) {
      throw new RangeError(`Loại hành lý không hợp lệ tại baggageList[${index}].type.`);
    }

    const weightKg = requireNonNegativeNumber(
      item.weightKg,
      `baggageList[${index}].weightKg`
    );
    const serviceFee = BAGGAGE_TYPES[item.type].fee;
    totalWeightKg += weightKg;
    specialServiceFee += serviceFee;
    return { name: item.name.trim(), type: item.type, weightKg, serviceFee };
  });

  const totalAllowanceKg = baseAllowanceKg + memberBonusKg;
  const overweightKg = Math.max(0, totalWeightKg - totalAllowanceKg);
  const firstBandKg = Math.min(overweightKg, 5);
  const remainingBandKg = Math.max(0, overweightKg - 5);
  const overweightFee =
    firstBandKg * OVERWEIGHT_RATE_FIRST_5_KG +
    remainingBandKg * OVERWEIGHT_RATE_AFTER_5_KG;
  const totalSurcharge = overweightFee + specialServiceFee;

  const result = {
    totalWeightKg,
    baseAllowanceKg,
    memberBonusKg,
    totalAllowanceKg,
    overweightKg,
    overweightFee,
    specialServiceFee,
    totalSurcharge,
    baggageItems,
  };

  return {
    ...result,
    receipt: formatReceipt(ticket, baggageItems, result),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateBaggageSurcharge };
}
