import { adminPageStyle } from '../components/admin/AdminTheme';
import { ReviewsView } from '../components/admin/ReviewsView';

export function AdminReviews() {
  return (
    <div style={adminPageStyle}>
      <ReviewsView />
    </div>
  );
}
