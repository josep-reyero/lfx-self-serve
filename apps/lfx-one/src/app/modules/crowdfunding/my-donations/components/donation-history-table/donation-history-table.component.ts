// Copyright The Linux Foundation and each contributor to LFX.
// SPDX-License-Identifier: MIT

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '@components/button/button.component';
import { EmptyStateComponent } from '@components/empty-state/empty-state.component';
import { MyDonation } from '@lfx-one/shared/interfaces';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lfx-donation-history-table',
  imports: [ButtonComponent, EmptyStateComponent, CurrencyPipe, DatePipe, SkeletonModule],
  templateUrl: './donation-history-table.component.html',
  styleUrl: './donation-history-table.component.scss',
})
export class DonationHistoryTableComponent {
  public readonly items = input.required<MyDonation[]>();
  /** True once the first donation-history request has settled; gates the empty state so it never flashes during load. */
  public readonly loaded = input<boolean>(false);
  public readonly hasMore = input<boolean>(false);
  public readonly loadingMore = input<boolean>(false);
  public readonly exploreUrl = input<string>('');

  public readonly loadMore = output<void>();

  protected onLoadMore(): void {
    this.loadMore.emit();
  }
}
