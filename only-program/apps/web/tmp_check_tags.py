import re

def check_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    depth = 0
    tags = []
    
    # Regex to find <div or </div>
    # This is a bit naive but should work for identifying the mismatch area
    tag_re = re.compile(r'<(div|/div)')
    
    for i, line in enumerate(lines):
        line_num = i + 1
        matches = tag_re.finditer(line)
        for match in matches:
            tag = match.group(0)
            prev_depth = depth
            if tag == '<div':
                depth += 1
            else:
                depth -= 1
            
            # Print ALL changes in the editor block
            if line_num >= 1775 and line_num <= 3562:
                print(f"Line {line_num}: {tag} | Depth: {prev_depth} -> {depth} | {line.strip()}")
            
            if depth < 0:
                print(f"Negative depth at line {line_num}: {line.strip()}")
                depth = 0 
    
    print(f"Final depth: {depth}")
    # Print depth changes for problematic areas
    # Focus on the editor view area
    for line_num, d in tags:
        if line_num > 1700 and line_num < 3500:
            pass # We could print here if needed

if __name__ == "__main__":
    check_tags("src/pages/Dashboard/Links.tsx")
