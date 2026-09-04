package com.mailflow.campaign.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CampaignSendWorker {

    private final CampaignService campaignService;

    @Value("${mailflow.campaign.send-batch-size:15}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${mailflow.campaign.send-interval-ms:5000}")
    public void tick() {
        try {
            campaignService.startDueScheduledCampaigns();
            int processed = campaignService.processPendingRecipients(batchSize);
            if (processed > 0) {
                log.debug("Campaign send worker processed {} recipients", processed);
            }
        } catch (Exception ex) {
            log.error("Campaign send worker tick failed: {}", ex.getMessage(), ex);
        }
    }
}
