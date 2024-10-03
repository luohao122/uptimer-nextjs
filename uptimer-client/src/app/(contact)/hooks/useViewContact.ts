import { MonitorContext } from "@/context/MonitorContext";
import {
  INotification,
  IUseViewContact,
} from "@/interfaces/notification.interface";
import { CHECK_CURRENT_USER } from "@/queries/auth";
import { DELETE_NOTIFICATION_GROUP } from "@/queries/contactGroup";
import { showErrorToast, showSuccessToast } from "@/utils/utils";
import { useMutation } from "@apollo/client";
import { useCallback, useContext } from "react";

export const useViewContact = (): IUseViewContact => {
  const {
    state: { notifications },
    dispatch,
  } = useContext(MonitorContext);
  const [deleteNotificationGroup] = useMutation(DELETE_NOTIFICATION_GROUP, {
    update(cache, { data: { deleteNotificationGroup } }) {
      const { checkCurrentUser } = cache.readQuery({
        query: CHECK_CURRENT_USER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      const notifications = checkCurrentUser.notifications.filter(
        (notification: INotification) =>
          notification.id !== deleteNotificationGroup.id
      );
      dispatch({
        type: "dataUpdate",
        payload: {
          user: checkCurrentUser.user,
          notifications,
        },
      });
      cache.writeQuery({
        query: CHECK_CURRENT_USER,
        data: {
          checkCurrentUser: {
            __typename: "CurrentUserResponse",
            user: checkCurrentUser.user,
            notifications,
          },
        },
      });
    },
  });

  const deleteGroup = useCallback(
    async (notificationId: number): Promise<void> => {
      try {
        const response = window.confirm("Are you sure you want to delete?");
        if (response) {
          await deleteNotificationGroup({ variables: { notificationId } });
          showSuccessToast("Deleted notification group");
        }
      } catch {
        showErrorToast("Error deleting notification group.");
      }
    },
    [deleteNotificationGroup]
  );

  return {
    notifications,
    deleteGroup,
  };
};
