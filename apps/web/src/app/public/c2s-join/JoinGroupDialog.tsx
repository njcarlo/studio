"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@studio/ui";
import { Button } from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { LoaderCircle, CheckCircle2 } from "lucide-react";
import { submitC2SJoinRequest } from "@/actions/c2s";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 61 }, (_, i) => CURRENT_YEAR - i);

export type JoinGroup = { id: string; name: string; location?: string | null };

export function JoinGroupDialog({
  group,
  onOpenChange,
}: {
  group: JoinGroup | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [socialMediaLink, setSocialMediaLink] = useState("");
  const [firstAttendedMonth, setFirstAttendedMonth] = useState("");
  const [firstAttendedYear, setFirstAttendedYear] = useState("");
  const [message, setMessage] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setBirthday("");
    setGender("");
    setSocialMediaLink("");
    setFirstAttendedMonth("");
    setFirstAttendedYear("");
    setMessage("");
    setPrivacyAccepted(false);
    setSubmitted(false);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!group) return;
      const res = await submitC2SJoinRequest({
        groupId: group.id,
        firstName,
        lastName,
        email,
        phone,
        birthday: birthday ? new Date(birthday) : undefined,
        gender,
        socialMediaLink: socialMediaLink || undefined,
        firstAttendedMonth: firstAttendedMonth || undefined,
        firstAttendedYear: firstAttendedYear ? parseInt(firstAttendedYear, 10) : undefined,
        message: message || undefined,
        privacyAccepted,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["public-c2s-groups"] });
    },
  });

  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    birthday &&
    gender &&
    privacyAccepted;

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={!!group} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold">Request Submitted</h2>
            <p className="text-muted-foreground max-w-sm">
              Your request to join <strong>{group?.name}</strong> has been sent to the mentor for
              review. You'll receive an email once it's been decided.
            </p>
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join C2S Group</DialogTitle>
              <DialogDescription>
                You're signing up for <span className="text-rose-500 font-medium">{group?.name}</span>
                {group?.location ? ` in ${group.location}.` : "."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="join-first-name">First Name *</Label>
                  <Input id="join-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="join-last-name">Last Name *</Label>
                  <Input id="join-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="join-email">Email Address *</Label>
                  <Input id="join-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="join-phone">Phone Number *</Label>
                  <Input id="join-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="join-birthday">Birthday *</Label>
                  <Input id="join-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="join-gender">Gender *</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="join-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="join-social">Social Media Link</Label>
                <Input
                  id="join-social"
                  value={socialMediaLink}
                  onChange={(e) => setSocialMediaLink(e.target.value)}
                  placeholder="Facebook URL"
                />
              </div>

              <div className="space-y-1.5">
                <Label>First Time Attended Church Of God (Month & Year)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={firstAttendedMonth} onValueChange={setFirstAttendedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={firstAttendedYear} onValueChange={setFirstAttendedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="join-notes">Notes / Questions</Label>
                <Textarea id="join-notes" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>

              <label className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm cursor-pointer">
                <Checkbox
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  I agree to the{" "}
                  <a href="/privacy" target="_blank" className="text-rose-500 hover:underline">
                    Data Privacy Policy
                  </a>{" "}
                  of Church of God Dasmariñas.
                </span>
              </label>

              {submitMutation.isError && (
                <p className="text-sm text-destructive text-center">Something went wrong. Please try again.</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600"
                disabled={!isValid || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Sign Me Up
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
