import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusPill } from '../components/ui/StatusPill';
import { Tabs } from '../components/ui/Tabs';
import { Switch } from '../components/ui/Switch';
import { Select } from '../components/ui/Select';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { Zap, Bell, Check } from 'lucide-react';

export const UiKitchenSink: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('one');
  const [switchVal, setSwitchVal] = useState(true);
  const [segmentedVal, setSegmentedVal] = useState('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-8 bg-[#F5FAF6] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B]">
          UI Component Kitchen Sink (/dev/ui)
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          GridSaathi Design System tokens, buttons, pills, controls, and dialogs
        </p>
      </div>

      {/* Buttons */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button
            variant="primary"
            icon={<Bell className="w-4 h-4" />}
            onClick={() => showToast({ type: 'success', title: 'Toast triggered!' })}
          >
            Trigger Toast
          </Button>
        </div>
      </section>

      {/* Status Pills */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">Status Pills (Icon + Word + Color)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status="stable" />
          <StatusPill status="watch" />
          <StatusPill status="constrained" />
          <StatusPill status="outage" />
        </div>
      </section>

      {/* Badges */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">Neutral 12px</Badge>
          <Badge variant="green">Stable Supply</Badge>
          <Badge variant="amber">Peak Warning</Badge>
          <Badge variant="red">Feeder Trip</Badge>
          <Badge variant="blue">System Info</Badge>
        </div>
      </section>

      {/* Segmented Control & Switch */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">Interactive Controls</h2>
        <div className="flex flex-wrap items-center gap-6">
          <SegmentedControl
            options={[
              { value: 'day', label: '24 Hours' },
              { value: 'week', label: '7 Days' },
              { value: 'month', label: '30 Days' },
            ]}
            value={segmentedVal}
            onChange={setSegmentedVal}
          />
          <Switch
            checked={switchVal}
            onChange={setSwitchVal}
            label="Auto-Consent Battery"
            description="Standing permission for pre-cut"
          />
        </div>
      </section>

      {/* Modals & Drawers */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">Overlays</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            Open Sample Modal
          </Button>
          <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
            Open Sample Drawer
          </Button>
        </div>
      </section>

      {/* Empty State & Skeletons */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">Empty States & Skeletons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EmptyState
            icon={<Zap className="w-6 h-6" />}
            title="No Outages Reported"
            description="The entire distribution network is running within normal thermal and voltage bands."
            actionLabel="View Topology"
            onAction={() => {}}
          />
          <div className="flex flex-col gap-2 p-4 border border-[#DDE9E0] rounded-[8px]">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kitchen Sink Modal"
        subtitle="Sample dialog demonstration"
      >
        <p className="text-xs text-[#5B6B62] leading-relaxed">
          Modals are reserved for high-intent actions such as emergency shutdowns or manual schedule overrides.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button size="sm" variant="ghost" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsModalOpen(false)}>
            Confirm
          </Button>
        </div>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Sample Drawer"
        subtitle="Side slide inspection panel"
      >
        <p className="text-xs text-[#5B6B62] leading-relaxed">
          Drawers display detailed telemetry for selected grid nodes without navigating away from the live schematic.
        </p>
      </Drawer>
    </div>
  );
};
