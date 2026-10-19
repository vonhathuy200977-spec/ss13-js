let tickets = [
  {
    pnr: 'VN1001',
    name: 'Nguyen Van An',
    flight: 'VN210',
    seat: '12A',
    type: 'ECONOMY',
    status: 'BOOKED',
  },
  {
    pnr: 'VN1002',
    name: 'Tran Thi Binh',
    flight: 'VN315',
    seat: '2C',
    type: 'BUSINESS',
    status: 'BOOKED',
  },
  {
    pnr: 'VN1003',
    name: 'Le Minh Chau',
    flight: 'VN410',
    seat: '18F',
    type: 'ECONOMY',
    status: 'BOOKED',
  },
];

function findTicketByPnr(pnr) {
  let i;

  for (i = 0; i < tickets.length; i++) {
    if (tickets[i].pnr === pnr) {
      return tickets[i];
    }
  }

  return null;
}

function calculateExcessBaggageFee(weight, type) {
  let freeWeight = 20;

  if (type === 'BUSINESS') {
    freeWeight = 30;
  }

  if (weight > freeWeight) {
    return (weight - freeWeight) * 50000;
  }

  return 0;
}

function displayBoardingPass(ticket) {
  let message = '--- BOARDING PASS ---\n';
  message += 'Hành khách: ' + ticket.name + '\n';
  message += 'Mã PNR: ' + ticket.pnr + '\n';
  message += 'Chuyến bay: ' + ticket.flight + '\n';
  message += 'Ghế: ' + ticket.seat + '\n';
  message += 'Hạng vé: ' + ticket.type + '\n';
  message += 'Hành lý: ' + ticket.baggageWeight + ' kg\n';
  message += 'Phụ thu: ' + ticket.baggageFee + ' VNĐ';

  alert(message);
}

function listTickets() {
  let message = 'Danh sách vé:\n';
  let i;
  let ticket;

  for (i = 0; i < tickets.length; i++) {
    ticket = tickets[i];
    message += '\nPNR: ' + ticket.pnr;
    message += '\nHành khách: ' + ticket.name;
    message += '\nChuyến bay: ' + ticket.flight;
    message += '\nGhế: ' + ticket.seat;
    message += '\nHạng vé: ' + ticket.type;
    message += '\nTrạng thái: ' + ticket.status + '\n';
  }

  alert(message);
}

function checkIn() {
  let pnr = prompt('Nhập mã PNR:');

  if (pnr === null) {
    return;
  }

  pnr = pnr.toUpperCase();
  let ticket = findTicketByPnr(pnr);

  if (ticket === null) {
    alert('Không tìm thấy vé.');
    return;
  }

  if (ticket.status !== 'BOOKED') {
    alert('Vé không thể check-in.');
    return;
  }

  let weightInput = prompt('Nhập cân nặng hành lý (kg):');

  if (weightInput === null || weightInput === '') {
    return;
  }

  let weight = Number(weightInput);

  if (isNaN(weight) || weight < 0) {
    alert('Cân nặng không hợp lệ.');
    return;
  }

  ticket.baggageWeight = weight;
  ticket.baggageFee = calculateExcessBaggageFee(weight, ticket.type);
  ticket.status = 'CHECKED_IN';

  alert('Check-in thành công.');
  displayBoardingPass(ticket);
}

function searchTicket() {
  let keyword = prompt('Nhập PNR hoặc tên hành khách:');
  let i;
  let ticket;
  let message = '';
  let found = false;

  if (keyword === null) {
    return;
  }

  keyword = keyword.toLowerCase();

  for (i = 0; i < tickets.length; i++) {
    ticket = tickets[i];

    if (
      ticket.pnr.toLowerCase() === keyword ||
      ticket.name.toLowerCase().indexOf(keyword) >= 0
    ) {
      message += 'PNR: ' + ticket.pnr;
      message += '\nHành khách: ' + ticket.name;
      message += '\nChuyến bay: ' + ticket.flight;
      message += '\nTrạng thái: ' + ticket.status + '\n\n';
      found = true;
    }
  }

  if (found === false) {
    alert('Không tìm thấy vé.');
  } else {
    alert(message);
  }
}

function cancelTicket() {
  let pnr = prompt('Nhập mã PNR cần hủy:');

  if (pnr === null) {
    return;
  }

  pnr = pnr.toUpperCase();
  let ticket = findTicketByPnr(pnr);

  if (ticket === null) {
    alert('Không tìm thấy vé.');
  } else if (ticket.status === 'CANCELLED') {
    alert('Vé đã được hủy.');
  } else {
    ticket.status = 'CANCELLED';
    alert('Đã hủy vé.');
  }
}

function main() {
  let choice;

  do {
    choice = prompt(
      '=== QUẢN LÝ VÉ MÁY BAY ===\n' +
      '1. Xem danh sách vé\n' +
      '2. Check-in\n' +
      '3. Tìm vé\n' +
      '4. Hủy vé\n' +
      '5. Thoát\n' +
      'Chọn chức năng:'
    );

    if (choice === null) {
      choice = '5';
    }

    switch (choice) {
      case '1':
        listTickets();
        break;
      case '2':
        checkIn();
        break;
      case '3':
        searchTicket();
        break;
      case '4':
        cancelTicket();
        break;
      case '5':
        alert('Đã thoát chương trình.');
        break;
      default:
        alert('Lựa chọn không hợp lệ.');
    }
  } while (choice !== '5');
}

main();
