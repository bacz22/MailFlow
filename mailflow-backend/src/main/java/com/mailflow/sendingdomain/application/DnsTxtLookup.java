package com.mailflow.sendingdomain.application;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
public class DnsTxtLookup {

    public List<String> lookupTxt(String fqdn) {
        String name = fqdn == null ? "" : fqdn.trim().toLowerCase(Locale.ROOT);
        if (name.isEmpty()) {
            return List.of();
        }
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("java.naming.provider.url", "dns:");
            DirContext ctx = new InitialDirContext(env);
            try {
                Attributes attrs = ctx.getAttributes(name, new String[]{"TXT"});
                Attribute txt = attrs.get("TXT");
                if (txt == null) {
                    return List.of();
                }
                List<String> values = new ArrayList<>();
                NamingEnumeration<?> all = txt.getAll();
                while (all.hasMore()) {
                    Object next = all.next();
                    if (next != null) {
                        values.add(next.toString().replace("\"", "").trim());
                    }
                }
                return values;
            } finally {
                ctx.close();
            }
        } catch (Exception ex) {
            log.debug("DNS TXT lookup failed for [{}]: {}", name, ex.getMessage());
            return List.of();
        }
    }

    public boolean anyContains(String fqdn, String needle) {
        if (needle == null || needle.isBlank()) {
            return false;
        }
        String target = needle.toLowerCase(Locale.ROOT);
        for (String value : lookupTxt(fqdn)) {
            if (value.toLowerCase(Locale.ROOT).contains(target)) {
                return true;
            }
        }
        return false;
    }
}
