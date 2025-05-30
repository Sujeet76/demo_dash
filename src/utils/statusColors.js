// Helper function for status colors
export function getStatusColor(status) {
  switch(status) {
    case 'Confirmed':
      return {
        bg: 'rgba(46, 125, 50, 0.2)',
        text: '#81c784'
      };
    case 'Pending':
      return {
        bg: 'rgba(237, 108, 2, 0.2)',
        text: '#ffb74d'
      };
    case 'Cancelled':
      return {
        bg: 'rgba(183, 28, 28, 0.2)',
        text: '#e57373'
      };
    default:
      return {
        bg: 'rgba(66, 66, 66, 0.2)',
        text: '#e0e0e0'
      };
  }
}
