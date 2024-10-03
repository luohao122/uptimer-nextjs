"use client";

import { ChangeEvent, FC, memo, ReactElement, useCallback } from "react";
import Link from "next/link";

import Button from "@/components/Button";
import TextInput from "@/components/TextInput";
import { ContactFormProps } from "@/interfaces/notification.interface";
import { isEmail } from "@/utils/utils";

const ContactForm: FC<ContactFormProps> = ({
  label,
  notificationGroup,
  emails,
  itemInput,
  setNotificationGroup,
  setEmails,
  setItemInput,
  onFormHandler,
}): ReactElement => {
  const handleGroupNameChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setNotificationGroup((prev) => ({ ...prev, groupName: value }));
    },
    [setNotificationGroup]
  );

  const handleEmailsChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setItemInput(value.toLowerCase());
    },
    [setItemInput]
  );

  const handleEmailsKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      if (
        key === "Enter" &&
        !emails.includes(itemInput) &&
        isEmail(itemInput)
      ) {
        setEmails((prev) => [...prev, itemInput]);
        setItemInput("");
        /**
         * This is added so the form does not automatically submit when
         * the use hits enter on the keyboard
         */
        event.preventDefault();
      }
    },
    [emails, itemInput, setEmails, setItemInput]
  );

  return (
    <form
      action={onFormHandler}
      className="m-auto px-6 relative min-h-screen xl:container md:px-12 lg:px-6"
    >
      <div className="py-2 text-base lg:text-xl font-bold m-auto mt-4 w-2/3">
        Contact Group Details
      </div>
      <div className="p-6 m-auto mt-4 border w-2/3 bg-lightGray">
        <div className="mt-5">
          <label
            htmlFor="notificationGroup"
            className="block mb-2 text-medium font-medium text-gray-900"
          >
            Group Name <sup className="text-red-400">*</sup>
          </label>
          <TextInput
            type="text"
            id="notificationGroup"
            className="bg-white border border-black text-gray-900 text-sm rounded-md block w-[50%] p-2.5 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a name for this group"
            value={notificationGroup.groupName}
            onChange={handleGroupNameChange}
          />
        </div>
        <div className="mt-5">
          <label
            htmlFor="emails"
            className="block mb-2 text-medium font-medium text-gray-900"
          >
            Email Address(es)
          </label>
          <div className="flex gap-2 mb-2 text-white">
            {emails.map((email: string, index: number) => (
              <div
                key={`${email}-${index}-${new Date().toISOString()}`}
                className="bg-blue-400 px-3 py-1 font-medium text-sm rounded-md flex gap-2"
              >
                {email}
                <span
                  onClick={() => {
                    const items: string[] = emails.filter(
                      (item: string) => item !== email
                    );
                    setEmails(items);
                  }}
                  className="font-bold cursor-pointer"
                >
                  x
                </span>
              </div>
            ))}
          </div>
          <TextInput
            type="text"
            id="emails"
            className="bg-white border border-black text-gray-900 text-sm rounded-md block w-[50%] p-2.5 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter email addresses"
            value={itemInput}
            onChange={handleEmailsChange}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onKeyDown={handleEmailsKeyDown as any}
          />
          <label htmlFor="emails" className="block my-1 text-xs text-gray-500">
            Hit Enter on your keyboard to add.
          </label>
        </div>
      </div>
      <div className="flex m-auto my-6 justify-end gap-x-4 w-2/3">
        <Link
          href="/contact"
          className="rounded bg-red-500 px-8 py-3 text-center text-sm font-bold text-white hover:bg-red-400 focus:outline-none md:py-3 md:text-base"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          label={label}
          className="rounded bg-sky-500 px-8 py-3 text-center text-sm font-bold text-white hover:bg-sky-400 focus:outline-none md:py-3 md:text-base"
        />
      </div>
    </form>
  );
};

export default memo(ContactForm);
