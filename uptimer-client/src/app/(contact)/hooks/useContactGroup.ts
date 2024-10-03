import { MonitorContext } from "@/context/MonitorContext";
import {
  INotification,
  INotificationGroup,
  IUseContact,
} from "@/interfaces/notification.interface";
import { apolloClient } from "@/queries/apolloClient";
import { CHECK_CURRENT_USER } from "@/queries/auth";
import {
  CREATE_NOTIFICATION_GROUP,
  UPDATE_NOTIFICATION_GROUP,
} from "@/queries/contactGroup";
import { showErrorToast, showSuccessToast } from "@/utils/utils";
import { FetchResult, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";

export const useContactGroupCreate = (): IUseContact => {
  const {
    state: { user },
    dispatch,
  } = useContext(MonitorContext);
  const [notificationGroup, setNotificationGroup] =
    useState<INotificationGroup>({
      groupName: "",
      emails: [],
    });
  const [itemInput, setItemInput] = useState<string>("");
  const [emails, setEmails] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [createNotificationGroup] = useMutation(CREATE_NOTIFICATION_GROUP, {
    update(cache, { data: { createNotificationGroup } }) {
      const { checkCurrentUser } = cache.readQuery({
        query: CHECK_CURRENT_USER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      const newNotificationGroup = createNotificationGroup.notifications[0];
      const notifications = [
        newNotificationGroup,
        ...checkCurrentUser.notifications,
      ];
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

  const onHandleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        if (
          !emails.length &&
          itemInput.length > 0 &&
          notificationGroup.groupName
        ) {
          const group = {
            ...notificationGroup,
            userId: user?.id,
            emails: JSON.stringify([itemInput]),
          };
          const result: FetchResult = await createNotificationGroup({
            variables: { group },
          });
          if (result) {
            showSuccessToast("Created notification group successfully.");
            router.push("/contact");
          }
        }

        if (emails.length > 0 && notificationGroup.groupName) {
          const group = {
            ...notificationGroup,
            userId: user?.id,
            emails: JSON.stringify(emails),
          };
          const result: FetchResult = await createNotificationGroup({
            variables: { group },
          });
          if (result) {
            showSuccessToast("Created notification group successfully.");
            router.push("/contact");
          }
        }
      } catch {
        showErrorToast("Error creating notification group");
      }
    });
  }, [
    createNotificationGroup,
    emails,
    itemInput,
    notificationGroup,
    router,
    user?.id,
  ]);

  return {
    isPending,
    notificationGroup,
    emails,
    itemInput,
    setNotificationGroup,
    setEmails,
    setItemInput,
    onHandleSubmit,
  };
};

export const useContactGroupEdit = (contactId: string): IUseContact => {
  const {
    state: { user },
  } = useContext(MonitorContext);
  const [notificationGroup, setNotificationGroup] =
    useState<INotificationGroup>({
      groupName: "",
      emails: [],
    });
  const [itemInput, setItemInput] = useState<string>("");
  const [emails, setEmails] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [updateNotificationGroup] = useMutation(UPDATE_NOTIFICATION_GROUP);
  const userData = apolloClient.readQuery({ query: CHECK_CURRENT_USER });

  const onHandleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        if (emails.length > 0 && notificationGroup.groupName) {
          const group = {
            ...notificationGroup,
            emails: JSON.stringify(emails),
          };
          const result: FetchResult = await updateNotificationGroup({
            variables: { notificationId: parseInt(contactId), group },
          });
          if (result) {
            router.push("/contact");
            showSuccessToast("Updated notification group successfully.");
          }
        }
      } catch {
        showErrorToast("Error updating notification group");
      }
    });
  }, [emails, notificationGroup, updateNotificationGroup, contactId, router]);

  useEffect(() => {
    if (userData) {
      const { notifications } = userData.checkCurrentUser;
      const notification = notifications.find(
        (notification: INotification) => notification.id === contactId
      );

      let parsedEmails: string[] = [];

      if (Array.isArray(notification?.emails)) {
        // If it's already an array, use it directly
        parsedEmails = notification.emails;
      } else if (typeof notification?.emails === "string") {
        // Try to parse if it's a JSON string
        try {
          parsedEmails = JSON.parse(notification.emails);
        } catch (error) {
          console.error(
            "Failed to parse emails, attempting to escape single quotes:",
            error
          );

          // Escape single quotes by converting them to valid double quotes
          const escapedEmails = notification.emails.replace(/'/g, '"'); // Convert single quotes to double quotes for valid JSON

          try {
            parsedEmails = JSON.parse(escapedEmails); // Try parsing the escaped string
          } catch (cleanError) {
            console.error(
              "Still failed to parse after escaping, using empty array:",
              cleanError
            );
            parsedEmails = []; // Fallback to empty array if all else fails
          }
        }
      }

      setNotificationGroup({
        userId: user?.id,
        groupName: notification?.groupName,
        emails: parsedEmails,
      });
      setEmails(parsedEmails);
    }
  }, [userData, user?.id, contactId]);

  return {
    isPending,
    notificationGroup,
    emails,
    itemInput,
    setNotificationGroup,
    setEmails,
    setItemInput,
    onHandleSubmit,
  };
};
