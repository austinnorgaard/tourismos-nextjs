import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PageWrapper from "@/components/PageWrapper";

function PlatformSelect({ name = "platform", value: initial = "facebook" }: { name?: string; value?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div>
  {/* keep hidden native input so FormData includes platform value */}
  <input type="hidden" name={name} value={value} aria-hidden="true" />
      <Select onValueChange={(v) => setValue(v)} defaultValue={initial}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="facebook">Facebook</SelectItem>
          <SelectItem value="instagram">Instagram</SelectItem>
          <SelectItem value="twitter">Twitter</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function Marketing() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log(Object.fromEntries(formData.entries()));
  };

  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marketing</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Goal</label>
          <Input type="text" name="goal" required className="w-full" placeholder="Promote summer tour packages" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Audience</label>
          <Input type="text" name="targetAudience" required className="w-full" placeholder="Families visiting Montana" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Key Message</label>
          <Textarea name="keyMessage" required rows={3} placeholder="20% off all tours booked this month" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Platform</label>
          <PlatformSelect />
        </div>

        <div>
          <Button type="submit" className="inline-flex items-center">
            <Send className="mr-2" />
            Generate
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}
