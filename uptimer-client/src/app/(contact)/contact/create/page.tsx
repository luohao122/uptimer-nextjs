"use client";

import { FC, memo, ReactElement } from "react";
import { useContactGroupCreate } from "../../hooks/useContactGroup";
import PageLoader from "@/components/PageLoader";
import ContactForm from "@/app/(contact)/components/ContactForm";

const CreateContact: FC = (): ReactElement => {
  const {
    isPending,
    notificationGroup,
    emails,
    itemInput,
    setNotificationGroup,
    setEmails,
    setItemInput,
    onHandleSubmit,
  } = useContactGroupCreate();

  return (
    <>
      {isPending ? (
        <PageLoader />
      ) : (
        <ContactForm
          label="Create Group"
          notificationGroup={notificationGroup}
          emails={emails}
          itemInput={itemInput}
          setNotificationGroup={setNotificationGroup}
          setEmails={setEmails}
          setItemInput={setItemInput}
          onFormHandler={onHandleSubmit}
        />
      )}
    </>
  );
};

export default memo(CreateContact);
