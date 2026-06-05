import { useDispatch, useSelector } from 'react-redux';
import { addPhone as addPhoneAction, removePhone as removePhoneAction, clear as clearAction } from '../store/compareSlice';

// Compatibility hook kept as `useCompare` so existing components don't need many edits.
export function useCompare() {
  const dispatch = useDispatch();
  const selected = useSelector(state => state.compare.selected || []);

  const addPhone = (phone) => dispatch(addPhoneAction(phone));
  const removePhone = (id) => dispatch(removePhoneAction(id));
  const clear = () => dispatch(clearAction());

  return { selected, addPhone, removePhone, clear };
}

export default null;
