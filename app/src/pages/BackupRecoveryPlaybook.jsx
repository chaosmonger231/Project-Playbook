import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import "./BackupRecoveryPlaybook.css";

const sections = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    theme: "blue",
    title: "Backup & Recovery Overview",
    intro:
      "This playbook helps organizations maintain backups, recover data cleanly, and restore operations without rushing compromised systems back into production.",
    bullets: [
      "Maintain a documented backup procedure.",
      "Demonstrate file recovery or database restoration.",
      "Keep at least one offline backup that ransomware cannot encrypt.",
      "Define recovery time objectives for critical systems.",
      "Document what was restored, how long it took, and any gaps found.",
      "Run a recovery drill or tabletop exercise to test the process.",
    ],
    note:
      "Backups are not only for data loss. They are a core business recovery tool after ransomware, endpoint compromise, or corruption.",
  },
  {
    id: "backup-strategy",
    label: "Backup Strategy",
    shortLabel: "Strategy",
    theme: "blue",
    title: "Pre-Incident Backup Strategy",
    intro:
      "A strong backup strategy should already be in place before an incident happens. The goal is to make sure recovery sources exist, are trusted, and are isolated from the attack itself.",
    cards: [
      {
        title: "Golden Images",
        text: "Golden images are trusted system images or snapshots used to rebuild systems. They should be standardized, patched before capture, kept minimal, and protected with least-privilege controls.",
      },
      {
        title: "Hash Verification",
        text: "Store the hash of each image or snapshot so the team can later confirm it has not been modified or compromised before use.",
      },
      {
        title: "Isolation",
        text: "Store images and backups in isolated locations such as an air-gapped zone or a separate network segment so they are less exposed to lateral movement or ransomware.",
      },
    ],
    bullets: [
      "Identify which systems need image-based recovery versus file or database restoration.",
      "Decide where backup copies are stored and who has access to them.",
      "Document how often backups run and how often restore tests are performed.",
    ],
    extraParagraphs: [
      "The term “Golden Image” is a buzzword often associated with backups, but its importance can not be overstated. It is important to understand what a Golden Image is, and at the end of the day, it is system images or snapshots. The system images and what is included need to be standardized, including images for operating systems, vital applications, containers, and security configurations. These are separate from data backups that include business or production data; these are specifically system images",
      "When Golden Images are built, they should include least-privilege access controls and include as few services as possible. Before Golden Images are built, the environment needs to be patched for vulnerabilities and verified prior to saving the image. Golden Images are so important since it is considered best practice to use a trusted rebuild source rather than repairing compromised endpoints.",
      "Now that you understand what a golden image is and why it is important. The next step is to determine where you store these images. There must be redundancy in these storage systems, but the key point is that they are in isolated locations, whether in an air-gapped zone or in their own network segment. Once you have stored your image, it is important to receive the hash. Getting the snapshot's hash ensures that, if it needs to be reimaged, it has not been changed or compromised in the event of an incident.",
    ],

  },
  {
    id: "storage-model",
    label: "Storage Model",
    shortLabel: "Storage",
    theme: "blue",
    title: "Redundant Backup Model",
    intro:
        "No single backup location is enough. Recovery plans should use multiple physical and logical storage boundaries.",
    table: {
        headers: ["Location", "Strength", "Main Risk"],
        rows: [
        [
            "Local Storage",
            "Fast restoration and minimal downtime.",
            "Vulnerable to lateral movement and ransomware if left inside the main environment.",
        ],
        [
            "Offline Storage",
            "Strong protection against ransomware encryption and direct access.",
            "Should be treated as a last line of defense, not the only backup plan.",
        ],
        [
            "Cloud Storage",
            "Adds geographic and physical redundancy.",
            "Must still be configured securely with proper access control.",
        ],
        ],
    },
    note:
        "Project Playbook recommends using all three where possible rather than depending on only one storage method.",
    extraParagraphs: [
        "The core principle of any good backup model is that no single backup location is enough. To achieve this, you need to diversify storage locations and boundaries. Diversifying storage locations does not mean having it on different devices on the network; rather, it means storing it in different physical and logical locations. Project Playbook recommends using all three locations: local storage, offline storage, and cloud storage.",
        "Local storage stores the snapshots within the organization's environment. While local storage allows for speedy restoration and therefore minimal downtime, the limitation is that storing snapshots in the organization’s environment makes it highly vulnerable to lateral movement and ransomware.",
        "Offline storage stores the snapshots in an air-gapped part of the environment. Air-gapped means the device and/or network are physically and logically isolated from other networks, preventing direct external access. While this methodology does have strong protection against ransomware encryption or unauthorized access, offline storage is and should be treated as the last line of defense.",
        "Cloud storage stores snapshots across multiple physical and geographic layers. As mentioned previously, extra layers of redundancy are best practice, and this provides a third and final layer. The main downside is that cloud backups are not inherently secure, so they do require proper configurations and access controls.",
    ],
    },
    {
    id: "recovery-objectives",
    label: "Recovery Objectives",
    shortLabel: "Objectives",
    theme: "violet",
    title: "Recovery Objectives & Prioritization",
    intro:
        "Recovery objectives help organizations reduce downtime and data loss while keeping essential operations available. They define what needs to be restored, the order of restoration, and the pace of recovery so technical decisions stay aligned with business impact.",
    extraParagraphs: [
        "Defining these details early removes the need to make difficult recovery decisions in the middle of an incident. Once recovery objectives are established, the next step is to translate them into practical recovery decisions by using system prioritization and recovery targets."
    ],
    detailSections: [
        {
        heading: "Setting Recovery Objectives",
        paragraphs: [
            "Recovery Objectives are metrics defined in a disaster recovery plan to minimize downtime and data loss while ensuring business operations continue. Their purpose is to officially define what needs to be restored, the order of restoration, and the pace at which recovery is achieved.",
            "These objectives matter because they align technical recovery efforts with business impact. Instead of restoring systems based only on convenience, recovery teams can make decisions that keep the most important operations available.",
            "In practice, this means organizations should decide ahead of time which systems matter most, how much downtime is acceptable, and how much data loss can realistically be tolerated."
        ]
        },
        {
        heading: "Tier-Based System Prioritization",
        paragraphs: [
            "One of the best ways to determine which systems need to be prioritized is through a tier-based system prioritization model. Not all systems in an environment are equal, so recovery should be business-driven rather than based only on what is easiest to restore first."
        ],
        note:
            "If organizations cut corners and restore a system before trust is re-established, they may increase damage or be forced to repeat the recovery process."
        },
        {
        heading: "Recovery Time Objective (RTO) & Recovery Point Objective (RPO)",
        paragraphs: [
            "When setting recovery objectives, two acronyms are central: RTO and RPO. These are set in advance to define the maximum acceptable downtime and the maximum acceptable data loss.",
            "RTO and RPO work hand in hand with the tier-based recovery model. Tier 1 systems usually have the lowest RTO and RPO because they are critical. Tier 2 systems often use more balanced recovery targets. Tier 3 systems usually have higher RTO and RPO values because they can tolerate slower recovery and less frequent backups."
        ]
        }
    ],
    table: {
        headers: ["Tier", "Purpose", "Examples", "Recovery Priority"],
        rows: [
        [
            "Tier 1 - Critical Infrastructure",
            "Systems required for core functionality and security with the lowest tolerance for downtime.",
            "Authentication & identity systems, databases supporting critical operations, DNS, DHCP, and other core network infrastructure.",
            "Highest priority"
        ],
        [
            "Tier 2 - Operational Systems",
            "Systems that support day-to-day work but do not immediately stop all operations if unavailable.",
            "In-house applications, department-specific services, and file storage systems.",
            "Medium priority"
        ],
        [
            "Tier 3 - Non-Essential Systems",
            "Systems that do not immediately impact operations and can tolerate longer downtime.",
            "Individual workstations, testing environments, printers, and other non-essential network-attached systems.",
            "Lowest priority"
        ]
        ]
    },
    bullets: [
        "Recovery order should be based on business impact, not convenience.",
        "Dependencies matter. Applications may need authentication systems restored first.",
        "If systems are interconnected, one system’s availability may depend on another.",
        "Critical systems must be verified as clean before full restoration is complete."
    ],
    cards: [
        {
        title: "Recovery Time Objective (RTO)",
        text: "RTO defines the maximum acceptable downtime for a system. Lower RTO means higher priority and faster recovery expectations, while higher RTO means lower priority and slower recovery expectations."
        },
        {
        title: "Recovery Point Objective (RPO)",
        text: "RPO defines the maximum acceptable data loss window. Lower RPO means backups must happen more frequently and the acceptable rollback point is much smaller."
        },
        {
        title: "How RTO and RPO Work Together",
        text: "Smaller RTO and RPO usually indicate critical systems. Tier 1 systems often require rapid recovery and frequent backups, Tier 2 systems use more balanced targets, and Tier 3 systems can tolerate slower recovery and less frequent backups."
        }
    ],
    note:
        "Recovery objectives should be defined before an incident happens so recovery teams can act with speed, consistency, and clear business priorities."
    },
  {
    id: "clean-restoration",
    label: "Clean Restoration",
    shortLabel: "Restoration",
    theme: "orange",
    title: "Clean Restoration Process",
    intro:
      "Recovery is not just restoring data. It is a controlled re-establishment of trust. Compromised systems should be treated as untrusted until proven clean.",
    cards: [
      {
        title: "Rebuild-First Approach",
        text: "Rebuild from trusted golden images instead of trying to repair compromised systems in place. This helps remove hidden persistence such as backdoors, malicious tasks, or registry tampering.",
      },
      {
        title: "When Rebuild Is Required",
        text: "Use rebuilds when compromise is confirmed, the scope is unknown, or the system is critical enough that trust must be rebuilt from scratch.",
      },
      {
        title: "Patch Before Reconnect",
        text: "Golden images may be older than the incident date, so apply current patches before reconnecting the restored system to production.",
      },
    ],
    bullets: [
      "Do not reconnect restored systems to production until validation is complete.",
      "Track which systems were rebuilt, restored, or intentionally held back for more investigation.",
    ],
    extraParagraphs: [
        "Clean Restoration Process",
        "Now that all of the pre-incident backup recovery work has been outlined, the next step is to discuss how to actually restore these backups and recover from an incident. The first step of this is a clean restoration. The purpose is to ensure that systems are restored to their trusted, uncompromised state. Reintroducing a system that is not clean opens the door to reintroducing malware, advanced persistent threats, and possible misconfigurations or previously exploited vulnerabilities. Recovery is more than just restoring, it is a controlled and verified re-establishment of trust.",
        "Rebuild-First Approach",
        "A core principle of IT restoration is to treat all compromised systems as untrusted by default. A rebuild-first approach prioritizes rebuilding systems from golden images over actively repairing them. The benefits of this approach include eliminating hidden persistence, such as artificial backdoors created during an incident, malicious scheduled tasks, and registry tampering.",
        "It is important to know when a rebuild is required versus simply removing or cleaning an endpoint. A rebuild should only occur when there is a confirmed compromise, an unknown scope of an intrusion, or, almost always, on a critical system where trust is essential.",
        "Some operational considerations include using pre-hardened golden images. This refers to golden images that can be verified as having been saved prior to the start of an incident. Since these golden images can be up to a few weeks back, be sure to apply the most recent patches before reconnecting to avoid any known vulnerabilities. Finally, ensure that system- or endpoint-specific settings are applied after the rebuild."
        ],
  },
  {
    id: "validation",
    label: "Validation",
    shortLabel: "Validation",
    theme: "green",
    title: "Backup Validation",
    intro:
        "Backups should never be trusted by default. They need to be validated before deployment.",
    bullets: [
        "Confirm the backup predates the compromise by reviewing logs and timeline evidence.",
        "Compare the backup hash to the known-good baseline.",
        "Run malware and rootkit checks on backup data.",
        "Restore the backup in an isolated environment first to confirm system functionality and the absence of malicious behavior.",
    ],
    table: {
        headers: ["Tool", "Recommended Use"],
        rows: [
        [
            "Wazuh",
            "Use File Integrity Monitoring, rootcheck, and malware detection to identify unexpected changes or compromised artifacts.",
        ],
        [
            "Suricata",
            "Monitor restored systems for suspicious outbound traffic, command-and-control behavior, or other network indicators of compromise.",
        ],
        ],
    },
    richSections: [
        {
        heading: "Backup Validation",
        paragraphs: [
            "If nothing else, understand that with backups, you do not trust them by default; they must be verified before deployment. There are validation steps that need to be taken. First, you must ensure that the backup predates any relation to the compromise by analyzing endpoint and network logs using a timeline. Secondly, you need to verify the integrity of the golden backup by comparing its hash to your known-good baseline. Thirdly, you need to perform malware and rootkit scans on backup data. Now that the backup has been validated, you still want to be 100% sure it's safe.",
            "Ensuring the backup is safe is done through a restoration test. Here, you restore a backup in an isolated or air-gapped environment to validate system functionality and data integrity and to identify the absence of malicious activity. This is done to ensure no traces of the malicious actor or any signs of hidden persistence are found prior to reintroducing systems into the production environment.",
            "Thankfully, both Suricata and Wazuh have functionality to assist with this process. Wazuh will be used for File Integrity Monitoring(FIM) to detect any unexpected changes. On top of that, Wazuh can also be used for rootcheck and malware detection, where any compromised artifacts will be unearthed. Wazuh documentation on <a href=\"https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html\" target=\"_blank\" rel=\"noreferrer\">FIM</a> and <a href=\"https://documentation.wazuh.com/current/user-manual/capabilities/malware-detection/rootkits-behavior-detection.html\" target=\"_blank\" rel=\"noreferrer\">RootKit/Malware Detection</a>. Suricata can be used to monitor restored systems for suspicious outbound traffic/exfiltration and command-and-control (C2) behavior. Project Playbook provided coverage for both of these alerts in our pre-made ruleset."        ]
        }
    ],
    warning:
        "Skipping validation can lead to reinfection cycles. Do not treat a system as restored until it has passed integrity and security checks.",
    },
  {
    id: "reinfection",
    label: "Reinfection Prevention",
    shortLabel: "Prevention",
    theme: "green",
    title: "Reinfection Prevention",
    intro:
        "Even after restoration, systems should be considered high-risk until the root cause of the incident has been addressed.",
    cards: [
        {
        title: "Patching",
        text: "Patch after rebuild or restoration and before reconnecting to production. Focus especially on previously exploited vulnerabilities and external-facing systems.",
        },
        {
        title: "IOC Blocking",
        text: "Block known malicious IPs, domains, file hashes, and traffic patterns using firewall controls, Suricata rules, and Wazuh detections.",
        },
        {
        title: "Heightened Monitoring",
        text: "Monitor restored systems for a defined period, such as two weeks, to catch residual or persistent activity before trust is fully restored.",
        },
    ],
    richSections: [
        {
        heading: "Reinfection Prevention",
        paragraphs: [
            "Ideally, rebuilding would mark the end of the disaster recovery process, but that would expose your environment to reinfection, forcing the organization to repeat the entire backup and recovery process. Reinfection prevention is a vital step to prevent that nightmare. Reinfection prevention is a step to ensure the restored systems are not instantly compromised again, and the point is to address and eliminate the root cause of the initial incident. Effective reinfection prevention ensures that a system is hardened, patched, and monitored for similar activity to the initial incident before reintroduction. It is always safe to assume the attack is persistent until it can definitively be proved otherwise."
        ]
        },
        {
        heading: "Patching",
        paragraphs: [
            "The first step to preventing reinfection is patching. Patching is effective because it eliminates known vulnerabilities that could have enabled the compromise. Older versions of software have known Common Vulnerabilities and Exploits(CVEs). CVEs are a double-edged sword. The organization knows the risk a vulnerability may pose, but the malicious actor also knows how to exploit it. Ensuring as few CVEs on a system as possible is ideal, but there are times when accepting risk is acceptable.",
            "In general, it is best to constantly patch and monitor systems for older software or operating systems with known CVEs. It is important to stay extra vigilant with external-facing systems as they will be probed the most. While it could go without saying, ensuring that previously exploited vulnerabilities of an incident are also patched.",
            "The timing of patching is also important. Patching must occur after a system rebuild or restoration and before reconnecting to the production or business network. The next step is to validate these patches on systems that have been taken offline or quarantined. This can be done by using tools like Wazuh to detect missing patches or identify vulnerable software."
        ]
        },
        {
        heading: "Indicator Of Compromise Blocking",
        paragraphs: [
            "Indicators of Compromise (IOCs) are cyber artifacts or evidence, such as IP addresses, malicious file hashes, or unusual network activity, that indicate a security breach has occurred. Identifying the IOC of an incident makes it easier to prevent reinfection. Actions like blacklisting an IP address or file hash, or creating rules to detect specific network traffic, are the best tools at your disposal. This can be done at three levels: firewall, Suricata, and Wazuh. Firewall rules can be set to not allow any traffic from certain domains or IPs, Suricata can be used to alert on suspicious outbound activity or exploit signatures, and Wazuh can be used to block malicious hash files or alert if a file has a malicious reputation by integrating tools like VirusTotal.",
            "Suricata will be the strongest tool for identifying and blocking IOCs. Good cyber posturing will include adding rules to detect the signature of previous incidents or behavior. Thankfully, Project Playbook has already provided a Suricata rule set to monitor suspicious DNS queries, command-and-control activity, and other abnormal traffic rules."
        ]
        },
        {
        heading: "Post-Recovery Monitoring",
        paragraphs: [
            "Post-Recovery Monitoring is a vital stage of preventing reinfection. You need to treat the restored systems as high-risk assets until proven otherwise. For a set period, Project Playbook recommends a defined heightened monitoring window, such as two weeks, depending on the risk it poses to an organization. Overall, proper reinfection prevention requires patching, blocking known IOCs, and additional monitoring for residual or persistent activity"
        ]
        }
    ]
    },
  {
    id: "reintroduction",
    label: "Reintroduction",
    shortLabel: "Reintro",
    theme: "teal",
    title: "Reintroduction to Production",
    intro:
        "Systems should not return to production immediately after restoration. Reintroduction should be phased and controlled.",
    richSections: [
        {
        heading: "Reintroduction to Production",
        paragraphs: [
            "Reintroduction to production may seem simple at first, but reintroduction is not immediate and is a controlled process. As outlined in previous sections, the system needs to be validated as clean, hardened through patching, and continuously monitored during and following the reintroduction process. Many organizations make the mistake of reconnecting their systems immediately after restoration, which leaves them vulnerable to reinfection. Systems must pass checks and undergo a brief quarantine monitoring phase. Project Playbook has split this process into phases to make the process clear and thorough."
        ]
        },
        {
        heading: "Phase 1 Controlled Environment Testing",
        paragraphs: [
            "Phase 1 will consist of putting the restored system in either a restricted VLAN or subnet. The goal is to limit any outbound traffic or a malicious actor's access to critical systems if an infection persists. The step is all about monitoring system behavior to ensure no artifacts remain, such as a suspicious scheduled task or network activity."
        ]
        },
        {
        heading: "Phase 2 Monitoring and Validation",
        paragraphs: [
            "Phase 2 follows after ensuring there is no suspicious behavior. This is the step where using Wazuh and Surricata would be used, as mentioned previously. To recap, Wazuh will be used to perform File Integrity Monitoring (FIM) and a rootkit/malware test on the system. Suricata will be used to actively monitor traffic from known malicious IP addresses and domains, as well as other network alerts that Project Playbook has implemented."
        ]
        },
        {
        heading: "Phase 3 Functional Testing",
        paragraphs: [
            "Phase 3 occurs after monitoring and validation using Project Playbook’s security stack. Now that the system operates as expected and all interconnectivity/dependencies have been addressed, you can begin integrating it back into production."
        ]
        },
        {
        heading: "Go / No-Go Decision",
        paragraphs: [
            "While these phases provide a strong structure for reintroduction, they leave a bit of gray area between the steps. To address this, Project Playbook has made a “Go/No-Go” checklist to ensure safe reintroduction. You check both lists and ensure all conditions in “Go” are met and abort if any conditions in “No-Go” are seen or active."
        ]
        }
    ],
    cards: [
        {
        title: "Phase 1 - Controlled Environment Testing",
        text: "Place restored systems in a restricted VLAN or subnet to limit risk and observe whether suspicious behavior remains."
        },
        {
        title: "Phase 2 - Monitoring and Validation",
        text: "Use Wazuh for File Integrity Monitoring and malware checks, and Suricata for network monitoring and known malicious activity alerts."
        },
        {
        title: "Phase 3 - Functional Testing",
        text: "Once clean behavior is confirmed and dependencies are addressed, verify the system works as expected before wider production reintegration."
        }
    ],
    goNoGo: {
        go: [
        "The system has been rebuilt from a validated golden image",
        "All known CVEs have been patched",
        "Changing credentials of a compromised user or system account.",
        "No Wazuh hits on FIM or RootKit/Malware check",
        "No Suricata hits or suspicious network activity found",
        "Passed Phase 1 Controlled Environment",
        "Passed Phase 2 Monitoring and Validating"
        ],
        noGo: [
        "Non-expected alerts or suspicious activity on the system",
        "Suspicious network activity",
        "Incomplete patching of services",
        "Incomplete configuration settings",
        "Backup integrity in question or unverified"
        ]
    },
    warning:
        "While the steps outlined in the reintroduction to production may seem slow or redundant, it is extremely important to control this process to avoid re-triggering the event. Skipping phases can lead to the continued persistence of a malicious actor or an even larger, more impactful attack."
    },
    {
        id: "lessons-learned",
        label: "Lessons Learned",
        shortLabel: "Lessons",
        theme: "pink",
        title: "Lessons Learned",
        intro:
            "After recovery, the team should move from reactive response to proactive improvement.",
        richSections: [
            {
            heading: "Lessons Learned",
            paragraphs: [
                "Now that the system has been cleanly restored and reintroduced into the environment, with no signs of infection remaining, the final step is to perform a lessons learned. The goal of this is to record and learn from the incident to improve future prevention, detection, and recovery processes. You want your organization to perform this, as it transitions from a reactive response to an incident to proactive improvement of your security posture."
            ]
            },
            {
            heading: "Review the Incident Timeline",
            paragraphs: [
                "The first step in a good lessons learned stage is to review the incident. You want to focus your review primarily on reconstructing the incident timeline. The key details of this timeline will be: the initial compromise, initial detection (if any), response actions, and the duration of the recovery process. These details are most important for determining the root cause of the incident and the vector through which the malicious actor gained access. Knowing these two details will allow you to add Wazuh or Suricatta rules or detections to completely avoid a similar incident.",
                "Another key detail is how fast the recovery process took. Making sure it met RPO/RTO objectives and identifying any details or issues that helped or prevented you from meeting those time and point objectives."
            ]
            },
            {
            heading: "What Went Well",
            paragraphs: [
                "Once a timeline of the incident has been made, the next step is to identify what went well during the process. This stage highlights where the team was effective in their response actions, how effective the tools were, and the coordination between teams and people. This is where you can give recognition to those who followed the correct containment steps or recovery steps."
            ]
            },
            {
            heading: "What Needs Improvement",
            paragraphs: [
                "After evaluating what went well, the next step is to review what didn't go well or needed improvement. This is where any gaps or flaws in detection, response, or recovery are identified, and solutions are recommended. It could also have been a misconfiguration or a lack of preparedness, even with a good security posture. Being honest and identifying where you went wrong will help prevent future incidents."
            ]
            },
            {
            heading: "Evaluate Backup and Recovery",
            paragraphs: [
                "Evaluating backup and recovery should be treated separately from the incident. Your team should review whether backups were available, verified, and restored without issue. This is where you review the RTO/RPO objectives and determine whether they were met and, if not, why not. This is the best time to notice or alert on any mistakes in backup frequency or on any structural weaknesses in the storage strategy."
            ]
            },
            {
            heading: "Turn Lessons Into Action",
            paragraphs: [
                "Lessons Learned is more than just a documentation and discussion phase. Once security flaws are identified, action is needed. This is where you can improve endpoint monitoring with Wazuh or add new network-detection rules with Suricatta. This is always a good time to specifically add the IOC from the incident, as well as IOCs identified in open-source intelligence threat updates."
            ]
            },
            {
            heading: "Follow-Up Exercises",
            paragraphs: [
                "Following an incident in which mistakes were made, or the process could have gone more smoothly, performing a follow-up tabletop exercise or recovery drill is a great way to prepare your organization for future attacks. This provides a lower-stakes scenario in which new suggestions or ideas from previous lessons can be put to the test to see how things might have gone differently."
            ]
            },
            {
            heading: "Formal Incident Report",
            paragraphs: [
                "Finally, it is important to produce a formal incident report. This is where you will outline everything discussed in this section. Obvious items of interest will be the incident timeline, impact assessment, actions taken, and any recommendations. It is important to document this in case of a similar incident in the future, but more importantly, it leads to actionable changes that improve your organization’s security posture."
            ]
            }
        ],
        cards: [
            {
            title: "Timeline Review",
            text: "Reconstruct the incident from initial compromise through detection, response, and full recovery."
            },
            {
            title: "Performance Review",
            text: "Measure what worked well, what failed, and whether response and recovery objectives were actually met."
            },
            {
            title: "Action and Follow-Up",
            text: "Update detections, improve monitoring, run a follow-up exercise, and document the final incident report."
            }
        ],
        note:
            "Lessons learned should lead to action. The value comes from improving detection, recovery, and future decision-making, not just documenting the incident."
        },
  {
    id: "tabletop",
    label: "Tabletop Exercise",
    shortLabel: "Tabletop",
    theme: "pink",
    title: "Tabletop Exercise & Moderator Guide",
    intro:
        "A tabletop exercise is a discussion-based activity where teams walk through a realistic incident scenario, talk through decisions, and identify strengths or gaps in their response process without the pressure of a live event.",
    richSections: [
        {
        heading: "What a Tabletop Exercise Is",
        paragraphs: [
            "A tabletop exercise gives organizations a structured way to practice decision-making, communication, and coordination during an incident. Instead of responding to a real event, participants talk through a realistic scenario and explain what they would do at each stage.",
            "This helps teams test whether their plans, roles, and technical processes make sense before a real emergency happens."
        ]
        },
        {
        heading: "Why It Is Needed",
        paragraphs: [
            "Tabletop exercises are useful because they expose weaknesses before an actual incident forces the organization to react under pressure. They help teams identify confusion around roles, gaps in communication, missing technical steps, and areas where policies or tools may not be enough.",
            "They also help organizations move from simply having a written process to actually understanding how that process would work in practice."
        ]
        },
        {
        heading: "This Is a Sample Tabletop",
        paragraphs: [
            "The scenario below is a sample tabletop exercise designed to help teams practice how they communicate, escalate, investigate, and make recovery decisions during a serious cyber incident. It is meant to encourage discussion, surface gaps, and improve future response readiness."
        ]
        },
        {
        heading: "Goal",
        paragraphs: [
            "Today, the goal is to have an open conversation between teams when there is an incident or regulatory issue, and to observe how different teams respond. We also want to review our initial process and correct any issues."
        ]
        },
        {
        heading: "Table Top Goals",
        paragraphs: [
            "Gain experience with a real-world situation and test:"
        ]
        },
        {
        heading: "Participant Roles",
        bullets: [
            "Assume incident response roles within the incident",
            "Don’t fight the scenario",
            "Make decisions with the available information",
            "If uncertain, ask. Don’t make up answers"
        ]
        },
        {
        heading: "Moderator Roles",
        bullets: [
            "Describe the exercise injects scenarios",
            "Prompt for more information",
            "Note interactions and decisions"
        ],
        note:
            "When you respond to a question for the first time, give your name and role in the university."
        },
        {
        heading: "Agenda",
        bullets: [
            "Moderator Introduction/Rules",
            "Introduction",
            "First Inject: Initial Notifications",
            "Tech teams are receiving notifications of high internet traffic, intermittent network outages, and site-wide connectivity issues"
        ],
        note:
            "The flow of this exercise will be that a moderator states an inject, then the IT team will respond accordingly. Once the moderator is satisfied with the answers or offers a suggestion for a better way to do it, the next inject is presented."
        }
    ],
    injects: [
        "Monday, 8:00 am: Tech teams are receiving notifications of high internet traffic, intermittent network outages, and site-wide connectivity issues",
        "The moderator injects that this is potentially a flood attack.",
        "Moderators now confirm that this is a DDoS attack",
        "Moderator injects that the Network is now down due to the attack",
        "Moderator informs that DDoS is often used in conjunction with another attack. They are targeting external-facing PAT addresses.",
        "The moderator declares that DDoS is a distraction for other activities",
        "Internal Alerts are triggered by file access anomalies, large numbers of file extension changes, and slow system performance.",
        "The DDoS attack was confirmed to distract from a ransomware attack. Files have been encrypted, and a ransom note has been found.",
        "Wazuh has been completely disabled on affected systems. How will teams validate which systems are impacted without full visibility on the environment?",
        "In this scenario, it was a user account in an IT department. They were able to elevate their powers to the top; what is the next step? What do we do with the user? We have their username, what systems they log in to, so what more are we looking into?",
        "Initial review shows that some local backups have been modified and encrypted. How do you determine which backups are still trustworthy? How can you be sure of when the attacks occurred and that the backups predate the compromise?",
        "Leadership is now asking if backups can be restored or if those are also compromised. After the last step, what is the process to choose restore points on endpoints?",
        "There are some signs showing that persistence mechanisms may still exist. Will you restore the systems to the environment? Step back and quarantine the environment?",
        "Critical systems are being redeployed. What criteria must be met before reconnecting more critical devices? Which Wazuh and Suricata tools can be used to assist?"
    ],
    note:
        "This sample tabletop is meant to guide discussion, not script a single correct answer. The value comes from how teams communicate, justify decisions, and identify improvements before a real incident occurs."
    },
  {
    id: "references",
    label: "References",
    shortLabel: "References",
    theme: "slate",
    title: "References",
    intro:
      "These references support the guidance in this playbook. Cybersecurity guidance, tooling, and best practices can change over time, so organizations should periodically review current standards, vendor documentation, and internal requirements before making operational decisions.",
    references: [
      {
        label: "NIST SP 800-61 Rev. 2 - Computer Security Incident Handling Guide",
        href: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf",
      },
      {
        label: "NIST SP 800-34 Rev. 1 - Contingency Planning Guide for Federal Information Systems",
        href: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf",
      },
      {
        label: "FBI - Ransomware",
        href: "https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/ransomware",
      },
      {
        label: "CISA - StopRansomware",
        href: "https://www.cisa.gov/stopransomware",
      },
      {
        label: "SANS - Incident Handler's Handbook",
        href: "https://www.sans.org/white-papers/33901",
      },
      {
        label: "Wazuh Documentation",
        href: "https://documentation.wazuh.com/current/index.html",
      },
      {
        label: "Suricata Documentation",
        href: "https://docs.suricata.io/en/suricata-8.0.4/",
      },
      {
        label: "Wazuh - File Integrity Monitoring",
        href: "https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html",
      },
      {
        label: "Wazuh - Rootkits Behavior Detection",
        href: "https://documentation.wazuh.com/current/user-manual/capabilities/malware-detection/rootkits-behavior-detection.html",
      },
      {
        label: "Wazuh - Malware Detection",
        href: "https://documentation.wazuh.com/current/user-manual/capabilities/malware-detection/index.html",
      },
    ],
  },
];

const legendItems = [
  { key: "blue", label: "Planning & backup design" },
  { key: "violet", label: "Recovery objectives" },
  { key: "orange", label: "Restoration workflow" },
  { key: "green", label: "Validation & reinfection prevention" },
  { key: "teal", label: "Reintroduction to production" },
  { key: "pink", label: "Lessons & tabletop" },
  { key: "slate", label: "References" },
];

function InfoCard({ title, text, themeClass }) {
  return (
    <div className={`backup-playbook-info-card ${themeClass}`}>
      <div className="backup-playbook-info-card-accent" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function SimpleTable({ headers, rows, themeClass }) {
  return (
    <div className={`backup-playbook-table-wrap ${themeClass}`}>
      <table className="backup-playbook-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cellIdx) => (
                <td key={`${idx}-${cellIdx}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepCard({ section, index, currentIndex, onClick }) {
  const isActive = index === currentIndex;
  const themeClass = `theme-${section.theme}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "backup-playbook-step-card",
        themeClass,
        isActive ? "is-active" : "",
      ].join(" ")}
      aria-label={`Go to ${section.label}`}
    >
      <div className="backup-playbook-step-number">{index + 1}</div>
      <div className="backup-playbook-step-label">{section.shortLabel}</div>
      <div className="backup-playbook-step-subtitle">{section.label}</div>
    </button>
  );
}

export default function BackupRecoveryPlaybook() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const currentSection = sections[currentIndex];
  const themeClass = `theme-${currentSection.theme}`;

  const progressPercent = useMemo(
    () => ((currentIndex + 1) / sections.length) * 100,
    [currentIndex]
  );

  const goPrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const goNext = () =>
    setCurrentIndex((prev) => Math.min(prev + 1, sections.length - 1));

  function updateScrollButtons() {
    const el = scrollRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
  }

  function scrollSteps(direction) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.72, 360);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => updateScrollButtons();
    const handleResize = () => updateScrollButtons();

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <ContentPanel>
      <div className="backup-playbook-page">
        <div className={`backup-playbook-hero ${themeClass}`}>
          <div className="backup-playbook-hero-top">
            <div className="backup-playbook-hero-copy">
              <div className="backup-playbook-hero-row">
                <h1 className="backup-playbook-hero-page-title">
                  Backup Recovery Playbook
                </h1>
                <div className="backup-playbook-section-pill">
                  Section {currentIndex + 1} of {sections.length}
                </div>
              </div>

              <h2 className="backup-playbook-hero-section-title">
                {currentSection.title}
              </h2>

              <p className="backup-playbook-hero-subtitle">
                Guided recovery planning, backup validation, reinfection
                prevention, and tabletop response.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/playbooks?section=response")}
              className="backup-playbook-back-btn"
            >
              Back to Playbooks
            </button>
          </div>

          <div className="backup-playbook-progress-wrap">
            <div className="backup-playbook-progress-head">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>

            <div className="backup-playbook-progress-track">
              <div
                className="backup-playbook-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="backup-playbook-legend backup-playbook-legend--top">
            <span className="backup-playbook-legend-title">Color guide</span>
            <div className="backup-playbook-legend-items">
              {legendItems.map((item) => (
                <div key={item.key} className="backup-playbook-legend-item">
                  <span
                    className={`backup-playbook-legend-swatch theme-${item.key}`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="backup-playbook-steps-shell">
            <div
              className={[
                "backup-playbook-steps-fade",
                "backup-playbook-steps-fade--left",
                canScrollLeft ? "is-visible" : "",
              ].join(" ")}
            />
            <div
              className={[
                "backup-playbook-steps-fade",
                "backup-playbook-steps-fade--right",
                canScrollRight ? "is-visible" : "",
              ].join(" ")}
            />

            <button
              type="button"
              className={[
                "backup-playbook-scroll-arrow",
                "backup-playbook-scroll-arrow--left",
                !canScrollLeft ? "is-hidden" : "",
              ].join(" ")}
              onClick={() => scrollSteps("left")}
              aria-label="Scroll sections left"
            >
              ‹
            </button>

            <div className="backup-playbook-steps-viewport">
              <div className="backup-playbook-steps-scroll" ref={scrollRef}>
                {sections.map((section, index) => (
                  <StepCard
                    key={section.id}
                    section={section}
                    index={index}
                    currentIndex={currentIndex}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className={[
                "backup-playbook-scroll-arrow",
                "backup-playbook-scroll-arrow--right",
                !canScrollRight ? "is-hidden" : "",
              ].join(" ")}
              onClick={() => scrollSteps("right")}
              aria-label="Scroll sections right"
            >
              ›
            </button>
          </div>
        </div>

        <div className={`backup-playbook-content-card ${themeClass}`}>
          <div className="backup-playbook-content-pill">{currentSection.label}</div>

          <p className="backup-playbook-content-intro">{currentSection.intro}</p>

          {currentSection.note && (
            <div className="backup-playbook-note-box">
              <strong>Key Note:</strong> {currentSection.note}
            </div>
          )}

          {currentSection.warning && (
            <div className="backup-playbook-warning-box">
              <strong>Warning:</strong> {currentSection.warning}
            </div>
          )}

          {currentSection.cards && (
            <div className="backup-playbook-card-grid">
              {currentSection.cards.map((card) => (
                <InfoCard
                  key={card.title}
                  title={card.title}
                  text={card.text}
                  themeClass={themeClass}
                />
              ))}
            </div>
          )}

          {currentSection.bullets && (
            <div className={`backup-playbook-bullets-box ${themeClass}`}>
              <ul>
                {currentSection.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {currentSection.table && (
            <SimpleTable
              headers={currentSection.table.headers}
              rows={currentSection.table.rows}
              themeClass={themeClass}
            />
          )}

          {currentSection.extraParagraphs && (
            <div className="backup-playbook-extra-paragraphs">
                {currentSection.extraParagraphs.map((paragraph, index) => (
                <p key={index} className="backup-playbook-extra-paragraph">
                    {paragraph}
                </p>
                ))}
            </div>
            )}

          {currentSection.detailSections && (
            <div className="backup-playbook-detail-sections">
                {currentSection.detailSections.map((section, index) => (
                <div key={index} className="backup-playbook-detail-section">
                    <h3 className="backup-playbook-detail-heading">{section.heading}</h3>

                    {section.paragraphs && (
                    <div className="backup-playbook-detail-paragraphs">
                        {section.paragraphs.map((paragraph, pIndex) => (
                        <p key={pIndex} className="backup-playbook-detail-paragraph">
                            {paragraph}
                        </p>
                        ))}
                    </div>
                    )}

                    {section.bullets && (
                    <div className="backup-playbook-detail-bullets">
                        <ul>
                        {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                        ))}
                        </ul>
                    </div>
                    )}

                    {section.note && (
                    <div className="backup-playbook-detail-note">
                        <strong>Important:</strong> {section.note}
                    </div>
                    )}
                </div>
                ))}
            </div>
            )}

            {currentSection.richSections && (
                <div className="backup-playbook-rich-sections">
                    {currentSection.richSections.map((section, index) => (
                    <div
                        key={index}
                        className={`backup-playbook-rich-section ${themeClass}`}
                    >
                        {section.heading && (
                        <h3 className="backup-playbook-rich-heading">{section.heading}</h3>
                        )}

                        {section.paragraphs && (
                        <div className="backup-playbook-rich-paragraphs">
                            {section.paragraphs.map((paragraph, pIndex) => (
                            <p
                                key={pIndex}
                                className="backup-playbook-rich-paragraph"
                                dangerouslySetInnerHTML={{ __html: paragraph }}
                            />
                            ))}
                        </div>
                        )}

                        {section.bullets && (
                        <div className="backup-playbook-rich-bullets">
                            <ul>
                            {section.bullets.map((bullet, bIndex) => (
                                <li key={bIndex}>{bullet}</li>
                            ))}
                            </ul>
                        </div>
                        )}

                        {section.note && (
                        <div className="backup-playbook-rich-note">
                            <strong>Important:</strong> {section.note}
                        </div>
                        )}
                    </div>
                    ))}
                </div>
                )}

          {currentSection.goNoGo && (
            <div className="backup-playbook-checklist-grid">
              <div className="backup-playbook-go-box">
                <h3>Go Checklist</h3>
                <ul>
                  {currentSection.goNoGo.go.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="backup-playbook-no-go-box">
                <h3>No-Go Checklist</h3>
                <ul>
                  {currentSection.goNoGo.noGo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {currentSection.injects && (
            <div className={`backup-playbook-panel-box ${themeClass}`}>
              <h3>Moderator Inject Sequence</h3>
              <ol>
                {currentSection.injects.map((inject) => (
                  <li key={inject}>{inject}</li>
                ))}
              </ol>
            </div>
          )}

          {currentSection.references && (
            <div className={`backup-playbook-panel-box ${themeClass}`}>
              <h3>Source List</h3>
              <ul className="backup-playbook-links-list">
                {currentSection.references.map((ref) => (
                  <li key={ref.href}>
                    <a href={ref.href} target="_blank" rel="noreferrer">
                      {ref.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="backup-playbook-bottom-area">
            <div className="backup-playbook-bottom-nav">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="backup-playbook-nav-btn backup-playbook-nav-btn--secondary"
              >
                ← Previous Section
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex === sections.length - 1}
                className="backup-playbook-nav-btn backup-playbook-nav-btn--primary"
              >
                Next Section →
              </button>
            </div>
          </div>
        </div>
      </div>
    </ContentPanel>
  );
}