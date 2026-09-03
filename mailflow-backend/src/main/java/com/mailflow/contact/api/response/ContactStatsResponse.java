package com.mailflow.contact.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactStatsResponse {

    private long total;
    private long active;
    private long unsubscribed;
    private long bounced;
    private long invalid;
    private long blocked;
}
