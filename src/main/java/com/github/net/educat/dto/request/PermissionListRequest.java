package com.github.net.educat.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PermissionListRequest {
	private List<String> permissions;
}

