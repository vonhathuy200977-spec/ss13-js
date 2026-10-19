'use strict';

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const passengers = [];
const SEAT_INVENTORY = [
  '12A', '12B', '12C', '12D',
  '14A', '14B', '14C', '14D',
  '15A', '15B', '15C', '15D',
];

class InputClosedError extends Error {}

function createPrompter() {
  const rl = readline.createInterface({ input, output });
  const lines = rl[Symbol.asyncIterator]();

  return {
    async question(prompt) {
      output.write(prompt);
      const result = await lines.next();
      if (result.done) throw new InputClosedError();
      return result.value;
    },
    close() {
      rl.close();
    },
  };
}

function normalize(value) {
  return value.trim().toUpperCase();
}

function isValidIdentityNumber(idNumber) {
  return /^\d{12}$/.test(idNumber) || /^[A-Z]\d{7,8}$/.test(idNumber);
}

function isValidFlightNumber(flightNumber) {
  return /^[A-Z]{2}\d{1,4}$/.test(flightNumber);
}

function findPassengerByPnr(pnrCode) {
  return passengers.find(
    (passenger) => passenger.pnrCode === normalize(pnrCode),
  );
}

function findAvailableSeat(flightNumber) {
  const occupiedSeats = new Set(
    passengers
      .filter(
        (passenger) =>
          passenger.flightNumber === flightNumber && passenger.isCheckedIn,
      )
      .map((passenger) => passenger.seatNumber),
  );

  return SEAT_INVENTORY.find((seat) => !occupiedSeats.has(seat));
}

function printPassenger(passenger) {
  console.log(
    `${passenger.pnrCode} | ${passenger.passengerName} | ` +
      `${passenger.idNumber} | ${passenger.flightNumber} | ` +
      `${passenger.seatNumber || 'Chưa có'} | ` +
      `${passenger.isCheckedIn ? 'Đã check-in' : 'Chưa check-in'}`,
  );
}

function printBoardingPass(passenger) {
  const width = 52;
  const line = '='.repeat(width);
  const field = (label, value) => `${label.padEnd(16)}: ${value}`;
  const barcode = `|||| ${passenger.pnrCode} ${passenger.flightNumber} ${passenger.seatNumber} ||||`;

  console.log(line);
  console.log('                 BOARDING PASS');
  console.log(line);
  console.log(field('Passenger', passenger.passengerName));
  console.log(field('PNR', passenger.pnrCode));
  console.log(field('Flight', passenger.flightNumber));
  console.log(field('Seat', passenger.seatNumber));
  console.log(field('ID / Passport', passenger.idNumber));
  console.log(line);
  console.log(barcode);
  console.log(line);
}

async function promptRequired(rl, label) {
  while (true) {
    const value = (await rl.question(label)).trim();
    if (value) return value;
    console.log('Thông tin không được để trống. Vui lòng nhập lại.');
  }
}

async function addPassenger(rl) {
  console.log('\n--- Tiếp nhận hồ sơ hành khách ---');
  let pnrCode = normalize(await promptRequired(rl, 'Mã PNR: '));
  while (findPassengerByPnr(pnrCode)) {
    console.log('Mã PNR đã tồn tại.');
    pnrCode = normalize(await promptRequired(rl, 'Nhập mã PNR khác: '));
  }

  const passengerName = (await promptRequired(rl, 'Họ và tên: '))
    .replace(/\s+/g, ' ');

  let idNumber = normalize(await promptRequired(rl, 'Số CCCD / hộ chiếu: '));
  while (!isValidIdentityNumber(idNumber)) {
    console.log('Giấy tờ không hợp lệ: CCCD gồm 12 chữ số hoặc hộ chiếu gồm 1 chữ cái và 7-8 chữ số.');
    idNumber = normalize(await promptRequired(rl, 'Nhập lại số giấy tờ: '));
  }

  let flightNumber = normalize(await promptRequired(rl, 'Số hiệu chuyến bay (ví dụ VN123): '));
  while (!isValidFlightNumber(flightNumber)) {
    console.log('Số hiệu chuyến bay không hợp lệ (2 chữ cái và 1-4 chữ số).');
    flightNumber = normalize(await promptRequired(rl, 'Nhập lại số hiệu chuyến bay: '));
  }

  passengers.push({
    pnrCode,
    passengerName,
    idNumber,
    flightNumber,
    seatNumber: null,
    isCheckedIn: false,
  });

  console.log('Đã tiếp nhận hồ sơ. Thông tin xác thực:');
  printPassenger(passengers[passengers.length - 1]);
}

async function checkInPassenger(rl) {
  console.log('\n--- Xác thực và check-in ---');
  const pnrCode = normalize(await promptRequired(rl, 'Mã PNR: '));
  const passenger = findPassengerByPnr(pnrCode);

  if (!passenger) {
    console.log('Không tìm thấy hồ sơ hành khách.');
    return;
  }
  if (passenger.isCheckedIn) {
    console.log('Hồ sơ này đã check-in và được cấp ghế.');
    printPassenger(passenger);
    return;
  }

  const flightConfirmation = normalize(
    await promptRequired(rl, 'Nhập lại số hiệu chuyến bay để đối chiếu: '),
  );
  if (flightConfirmation !== passenger.flightNumber) {
    console.log('Từ chối check-in: số hiệu chuyến bay không khớp hồ sơ.');
    return;
  }

  if (!isValidIdentityNumber(passenger.idNumber)) {
    console.log('Từ chối check-in: giấy tờ tùy thân trong hồ sơ không hợp lệ.');
    return;
  }
  console.log('Xác thực giấy tờ: hợp lệ.');
  console.log('Đối chiếu chuyến bay: khớp.');

  const seatNumber = findAvailableSeat(passenger.flightNumber);
  if (!seatNumber) {
    console.log('Không còn ghế trống trên chuyến bay này.');
    return;
  }

  const seatAlreadyOccupied = passengers.some(
    (record) =>
      record.flightNumber === passenger.flightNumber &&
      record.isCheckedIn &&
      record.seatNumber === seatNumber,
  );
  if (seatAlreadyOccupied) {
    console.log('Không thể check-in: ghế vừa chọn đã được sử dụng.');
    return;
  }

  passenger.seatNumber = seatNumber;
  passenger.isCheckedIn = true;
  console.log(`Check-in thành công. Ghế được cấp: ${seatNumber}`);
  printPassenger(passenger);
}

function listPassengers() {
  console.log('\n--- Danh sách hồ sơ ---');
  if (passengers.length === 0) {
    console.log('Chưa có hồ sơ hành khách.');
    return;
  }

  console.log('PNR | Họ tên | Giấy tờ | Chuyến bay | Ghế | Trạng thái');
  passengers.forEach(printPassenger);
}

async function showBoardingPass(rl) {
  console.log('\n--- In thẻ lên tàu bay ---');
  const pnrCode = normalize(await promptRequired(rl, 'Mã PNR: '));
  const passenger = findPassengerByPnr(pnrCode);

  if (!passenger) {
    console.log('Không tìm thấy hồ sơ hành khách.');
    return;
  }
  if (!passenger.isCheckedIn || !passenger.seatNumber) {
    console.log('Chưa thể in thẻ: hành khách chưa hoàn tất check-in.');
    return;
  }

  printBoardingPass(passenger);
}

function printMenu() {
  console.log('\n=== QUẢN LÝ HỒ SƠ HÀNH KHÁCH & CHECK-IN ===');
  console.log('1. Tiếp nhận hồ sơ hành khách');
  console.log('2. Xác thực và check-in');
  console.log('3. Xem danh sách hồ sơ');
  console.log('4. In thẻ lên tàu bay');
  console.log('0. Thoát');
}

async function main() {
  const rl = createPrompter();
  try {
    let running = true;
    while (running) {
      printMenu();
      const choice = (await rl.question('Chọn chức năng: ')).trim();
      switch (choice) {
        case '1':
          await addPassenger(rl);
          break;
        case '2':
          await checkInPassenger(rl);
          break;
        case '3':
          listPassengers();
          break;
        case '4':
          await showBoardingPass(rl);
          break;
        case '0':
          running = false;
          console.log('Đã thoát chương trình.');
          break;
        default:
          console.log('Lựa chọn không hợp lệ. Vui lòng chọn lại.');
      }
    }
  } catch (error) {
    if (!(error instanceof InputClosedError)) throw error;
    console.log('\nĐã kết thúc đầu vào.');
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('Lỗi chương trình:', error.message);
  process.exitCode = 1;
});
